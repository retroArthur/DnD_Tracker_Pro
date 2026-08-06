---
phase: 10-security-h-rtung
plan: 07
subsystem: security
tags: [xss, css-injection, sanitization, rich-text-editor, gap-closure, dom-sanitizer, information-disclosure]

# Dependency graph
requires:
  - phase: 10-security-h-rtung
    provides: "10-06 (Tabellenzweig über Allowlist-Sanitizer, SC3) + 10-REVIEW-GAP.md (WR-01/WR-02/WR-03/IN-01 + der von zwei Prüfern unabhängig gefundene CSS-Beacon)"
provides:
  - "Wertprüfung pro Stil-Deklaration gegen eine Erlaubnisliste zulässiger CSS-Funktionsnamen (allowedStyleFunctions/isSafeStyleValue()) in BEIDEN Sanitizer-Zwillingen — schließt den CSS-basierten Ausgangs-Beacon (T-10-30)"
  - "Verhaltensbasierter Erlaubnislisten-Wächtertest (tests/unit/security.test.js) als Strukturzaun gegen künftige stille Aufweichung der Tag-/Stil-Erlaubnislisten (Restrisiko d, T-10-36)"
  - "Vollständig dispositioniertes Threat-Register: T-10-30..T-10-40/AR-10-06..AR-10-12 in 10-SECURITY.md — threats_open: 0 ist wieder wahr"
  - "Faktisch korrigierte SECURITY.md (Abschnitt 4 Zeilenverweise, Korrekturdatum, Befund 7, sechs neue/präzisierte akzeptierte Restrisiken)"
affects: [10-security-h-rtung-phase-abschluss]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS-Stilwert-Erlaubnisliste als Sicherheitskontrolle: Prüfung PRO DEKLARATION anhand der Bezeichnerfolge unmittelbar vor jeder öffnenden Klammer gegen eine Funktionsnamen-Erlaubnisliste — immun gegen Kommentar-/Escape-Verschleierung, weil diese die Bezeichnerfolge selbst zerstört (Gegenmuster zum gescheiterten Denylist-Reflex aus Plan 10-04)"
    - "Netzwerk-Beobachter für tote Gegenstellen: E2E-Tests gegen einen garantiert unerreichbaren lokalen Port (Verwerf-Port 9) müssen sowohl 'request' als auch 'requestfailed' beobachten, da eine tote Gegenstelle niemals ein 'response'-Ereignis erzeugt — der rote Lauf mit nicht-leerer Sammlung ist zugleich die Positivkontrolle des Beobachters"
    - "Verhaltensbasierter Erlaubnislisten-Wächtertest als einzige unabhängige Schicht bei Single-Control-Sicherheitsgarantien: die Liste wird als eigenes Testdatum behauptet (nicht aus der Produktionsliste abgeleitet), damit spätere Aufweichung sichtbar rot statt still wird"

key-files:
  created: []
  modified:
    - utils/basic.js
    - utils/testable-utils.js
    - tests/unit/security.test.js
    - tests/unit/sanitizer-parity.test.js
    - tests/e2e/features/editor-insert.spec.js
    - ui/editors/rich-text.js
    - .planning/phases/10-security-h-rtung/10-SECURITY.md
    - SECURITY.md

key-decisions:
  - "Angriffsvektoren nutzen die Eigenschaft 'background', nicht 'background-image': 'background-image' steht NICHT auf sanitizeHTML()s allowedAttributes.style-Liste und würde schon vom bestehenden Eigenschaftsnamen-Filter blockiert — das reproduziert den Bug nicht. 'background' steht auf der Liste (Hintergrund-Kurzform) und ist die tatsächlich betroffene Eigenschaft, über die ein Wert wie url(...) unangetastet durchging"
  - "E2E-Testvektoren variieren die Notationsform des STIL-ATTRIBUTS selbst (doppelt/einfach/unquotiert), nicht die Notation des url()-Werts — weil die kosmetische Attribut-Entfernungskette in handleEditorPaste() nur doppelt quotierte style=\"...\"-Attribute vor dem Sanitizer entfernt (D-01/T-10-39, Quote-Asymmetrie). Die doppelt quotierte Zelle im Testpayload beweist strukturell nichts über die neue Wertprüfung (sie wird schon vorher entfernt); einfach quotiert und unquotiert sind die eigentlichen Beweisträger für Ursache 1. Die Unit-Vektoren (security.test.js) rufen sanitizeHTML() dagegen direkt auf und variieren stattdessen die Notation des url()-WERTS, wie vom Plan verlangt"
  - "Tabellen-Wrapper (<table><tr><td style=...>) statt freistehender <td> in allen neuen Unit-Testvektoren: der HTML5-Parser verwirft ein <td> außerhalb eines Tabellenkontexts als eigenständiges Element (Foster-Parenting), wodurch das Stil-Attribut nie beim Sanitizer ankäme — ohne Tabellenkontext wären alle Vektoren fälschlich grün gelaufen, unabhängig vom Fix"
  - "Erlaubnislisten-Wächtertest (Task 2) prüft Tabellen-Kindelemente (thead/tbody/tr/th/td) ebenfalls über einen Tabellen-Wrapper-Helfer statt freistehend — derselbe Foster-Parenting-Grund"
  - "allowedStyleFunctions = ['var','rgb','rgba','hsl','hsla','calc'] — var(...) ist nicht optional (der Tabellen-Einfügepfad injiziert border/background-Deklarationen mit Custom-Property-Referenzen, die den eingefrorenen TABELLEN_ERWARTET-Erwartungswert bilden); rgb/rgba/hsl/hsla decken legitime Farbfunktionen ab; calc() ist eine verbreitete, ausführungsfreie Layout-Funktion ohne Netzwerksemantik"
  - "Restrisiken (a)-(f) aus 10-REVIEW-GAP.md werden ausschließlich dokumentiert (Registerzeilen T-10-33..T-10-39/AR-10-06..AR-10-12 + sechs neue/präzisierte Punkte in SECURITY.md), nicht behoben — bewusste Nutzerentscheidung laut Plan-Prohibition (enger Fix statt breitem Umbau)"

requirements-completed: [SEC-01, SEC-02]

coverage:
  - id: D1
    description: "Beide Sanitizer-Zwillinge (utils/basic.js, utils/testable-utils.js) prüfen den Wert einer style-Deklaration jetzt zusätzlich zum Eigenschaftsnamen gegen eine Erlaubnisliste zulässiger CSS-Funktionsnamen; ein Stilwert mit fremder Ressourcen-Referenz (background:url(...)) überlebt weder Einfügen noch Speichern noch Neuladen und erzeugt keine ausgehende Anfrage"
    requirement: "SEC-01"
    verification:
      - kind: unit
        ref: "tests/unit/security.test.js#Beacon-Regression (T-10-30, D-13) — acht Angriffsvektoren + fünf Erhaltungs-Gegenproben + Teil-Erhaltungstest gegen den echten Produktions-Sanitizer (vm.runInContext), rot vor dem Fix (Commit 65dab7a), grün danach (Commit ab5cabc)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/features/editor-insert.spec.js#Sicherheits-Regression: Stilwert mit fremder Ressourcen-Referenz erzeugt keine ausgehende Anfrage — auch nicht nach Speichern und Neuladen, rot vor dem Fix (nicht-leere Anfragesammlung + Stil-Attribut mit Marker), grün danach"
        status: pass
      - kind: unit
        ref: "tests/unit/sanitizer-parity.test.js — 9 neue Vektoren additiv im gemeinsamen VECTOR_SET, bytegleiche Ausgabe beider Zwillinge"
        status: pass
      - kind: e2e
        ref: "volles vierteiliges Editor-Regressionsnetz: 84 passed / 0 failed (Referenz Schritt 0: 83, +1 neuer Fall), byte-exakter Erwartungswert TABELLEN_ERWARTET unverändert"
        status: pass
    human_judgment: false
  - id: D2
    description: "Verhaltensbasierter Erlaubnislisten-Wächtertest hält Tag- und Stil-Eigenschafts-Erlaubnisliste als eigenes Testdatum fest (Restrisiko d, T-10-36); Nicht-Tautologie durch einmalige gezielte Mutation verifiziert"
    requirement: "SEC-01"
    verification:
      - kind: unit
        ref: "tests/unit/security.test.js#ERLAUBNISLISTEN-WAECHTER — 29 Muss-erhalten- + 12 Darf-nicht-erhalten-Tag-Tests + 3 Stil-Eigenschafts-Tests, alle grün; Gegenprobe (MUST_NOT_BE_ALLOWED_STYLE_PROPS um 'color' erweitert) lief einmalig rot, danach zurückgesetzt"
        status: pass
    human_judgment: false
  - id: D3
    description: "WR-03: keine Sicherheitsassertion der beiden in Plan 10-06 ergänzten Testfälle hängt mehr an einer festen Wartezeit; das vorbestehende vierte Vorkommen aus dem 10-04-Test bleibt unangetastet"
    requirement: "SEC-01"
    verification:
      - kind: other
        ref: "grep -v '^\\s*//' tests/e2e/features/editor-insert.spec.js | grep -c waitForTimeout → 1; git diff tests/e2e/features/editor-insert.spec.js seit b908362 | grep '^-' | grep -c 'expect(' → 0 (keine Assertion entfernt)"
        status: pass
    human_judgment: false
  - id: D4
    description: "IN-01: Kommentar über der Sanitisierungsstufe in ui/editors/rich-text.js nennt jetzt alle fünf gefährlichen Protokolle statt drei"
    requirement: "SEC-01"
    verification:
      - kind: other
        ref: "awk '/Sanitisierungsstufe/,/insertHtmlAtSelection\\(safeTable\\)/' ui/editors/rich-text.js | grep -c 'blob:' → 1, grep -c 'file:' → 1"
        status: pass
    human_judgment: false
  - id: D5
    description: "Threat-Register vollständig dispositioniert (T-10-30..T-10-40, AR-10-06..AR-10-12) und SECURITY.md faktisch korrigiert (WR-01 Zeilenverweise, WR-02 Datumsangaben) — threats_open: 0 ist in beiden Dokumenten wieder wahr, weil jeder bekannte Restrisiko-Punkt eine Disposition trägt"
    requirement: "SEC-02"
    verification:
      - kind: other
        ref: "Alle neun in SECURITY.md Abschnitt 4 zitierten Zeilennummern gegen sed -n '<N>p' verifiziert (siehe Zuordnungstabelle unten); grep -c '2026-07-26' in beiden Dateien → 0; grep -c 'T-10-3[0-9]\\|T-10-40' 10-SECURITY.md → 21, grep -c 'AR-10-0[6-9]\\|AR-10-1[0-2]' → 10"
        status: pass
    human_judgment: false

duration: ~55min
completed: 2026-07-25
status: complete
---

# Phase 10 Plan 07: Gap-Closure Runde 2 — CSS-Beacon geschlossen, Threat-Register vollständig dispositioniert Summary

**Stilwert-Erlaubnisliste (`allowedStyleFunctions`/`isSafeStyleValue()`) in beiden Sanitizer-Zwillingen schließt den unabhängig bestätigten CSS-basierten Ausgangs-Beacon; vier Dokumentationsfunde aus `10-REVIEW-GAP.md` behoben; Threat-Register vollständig dispositioniert (threats_open: 0 wieder wahr).**

## Performance

- **Duration:** ~55 min
- **Tasks:** 3 (Task 1 `type="tracer" tdd="true"`, Task 2 + 3 `type="auto"`)
- **Files modified:** 8

## Accomplishments

- **Erhaltungsfrage beantwortet, bevor Code geändert wurde (Schritt 0b).** Repo-weite Suche nach App-erzeugten Inline-Stilen mit Funktionsklammer-Werten:
  ```
  grep -rnE "style\s*=\s*[\"'][^\"']*\(" --include="*.js" core utils systems features render ui assets/templates
  grep -rnE "background-image" --include="*.js" core utils systems features render ui assets/templates
  grep -rnE "style\s*=\s*[\"'][^\"']*\(" assets/templates
  grep -rn "background-image" assets/templates
  ```
  Ergebnis: ausschließlich `var(--…)`-Custom-Property-Referenzen in Inline-Stilen im gesamten Produktionscode und in allen HTML-Templates — keine `url()`-, `image-set()`- oder sonstige Funktionswerte. Der einzige `background-image`-Treffer liegt in `ui/editors/rich-text.js:806` (`EMPTY_BACKGROUND_LONGHANDS`, eine Chromium-Quirk-Nachbildung, die die Langform-Eigenschaft immer auf einen LEEREN Wert `;` setzt, niemals auf `url(...)`) — irrelevant für die neue Wertprüfung. `systems/avatars.js` gelesen: Porträtbilder werden ausschließlich über `img.src` (DOM-Eigenschaft, kein `sanitizeHTML()`-Aufruf, kein Inline-Stil) gesetzt — kein legitimer Treffer, der die Wertprüfung beschädigen könnte. Kein Anhalten nötig; die Wertprüfung war sicher umsetzbar.
- **Task 1 (RED, Unit + E2E):** neuer Beschreibungsblock in `tests/unit/security.test.js` gegen den echten Produktions-Sanitizer (acht Angriffsvektoren + fünf Erhaltungs-Gegenproben + Teil-Erhaltungstest, Marker `LEAK`). Roter Lauf gegen den ungepatchten Stand:
  ```
  Tests:       9 failed, 75 skipped, 5 passed, 89 total
  ● ... Ressourcen-Referenz doppelt quotiert — Marker LEAK kommt in der Ausgabe nicht vor
    Expected substring: not "LEAK"
    Received string: "<table><tbody><tr><td style=\"background:url(&quot;https://evil.example/LEAK-DQ&quot;)\">Zelle</td></tr></tbody></table>"
  ```
  Neuer E2E-Fall in `tests/e2e/features/editor-insert.spec.js` mit Netzwerk-Beobachter über `page.on('request', ...)` UND `page.on('requestfailed', ...)` gegen die tote Gegenstelle `http://127.0.0.1:9` (Verwerf-Port). Roter Lauf:
  ```
  Error: expect(received).toBe(expected) // Object.is equality
  Expected: false
  Received: true
    619 |             expect(hasMarkerInStyleAfterPaste).toBe(false);
  ```
  Ein separat ausgeführter Diagnose-Lauf (identischer Payload, ohne die spätere strukturelle Assertion) bestätigt die Positivkontrolle des Netzwerk-Beobachters direkt:
  ```
  OBSERVED: ["REQ:http://127.0.0.1:9/LEAK-SQ","REQ:http://127.0.0.1:9/LEAK-UQ","FAIL:http://127.0.0.1:9/LEAK-SQ","FAIL:http://127.0.0.1:9/LEAK-UQ"]
  ```
  (Die doppelt quotierte Zelle im selben Payload wurde bereits von der VOR dem Sanitizer laufenden Kosmetik-Kette entfernt — D-01/T-10-39 — und beweist strukturell nichts über die neue Wertprüfung; einfach quotiert und unquotiert sind die Beweisträger.)
- **Task 1 (GREEN, Produktionsfix):** `allowedStyleFunctions = ['var','rgb','rgba','hsl','hsla','calc']` + `isSafeStyleValue(value)` identisch in `utils/basic.js` und `utils/testable-utils.js`, jeweils innerhalb von `sanitizeHTML()` neben `cleanNode`. Prüfung pro Deklaration: kleingeschrieben betrachtet, At-Regel-Einleitung (`@`) sofort unsicher, für jede öffnende Klammer die unmittelbar davorstehende Bezeichnerfolge (`[a-z0-9_-]`) gegen die Erlaubnisliste geprüft. Der bestehende Stil-Filter zerlegt jede Deklaration jetzt am ERSTEN Doppelpunkt (nicht an jedem) und verwirft nur die betroffene Deklaration, nicht das gesamte Attribut. 9 neue Vektoren additiv in `tests/unit/sanitizer-parity.test.js`s `VECTOR_SET`. Ergebnis: Unit 159/159 grün (Referenz 136, +23), vierteiliges Editor-Netz 84 passed/0 failed (Referenz 83, +1), byte-exakter `TABELLEN_ERWARTET`-Erwartungswert unverändert.
- **Task 2 (WR-03, IN-01, Wächtertest, volles Gate):** die drei festen `page.waitForTimeout(300)`-Aufrufe in den beiden Plan-10-06-Testfällen entfernt (der Einfügepfad läuft vollständig synchron im paste-Event-Handler); das vorbestehende vierte Vorkommen aus dem 10-04-Test blieb unangetastet. Kommentar über der Sanitisierungsstufe in `ui/editors/rich-text.js` korrigiert: nennt jetzt alle fünf gefährlichen Protokolle (`javascript:`/`vbscript:`/`data:`/`file:`/`blob:`) statt drei. Neuer verhaltensbasierter Erlaubnislisten-Wächtertest in `tests/unit/security.test.js` (29 Muss-erhalten-Tags, 12 Darf-nicht-erhalten-Tags, 3 verbotene Stil-Eigenschaften: `background-image`, `position`, `behavior`); Nicht-Tautologie einmalig verifiziert (`MUST_NOT_BE_ALLOWED_STYLE_PROPS` testweise um `'color'` erweitert → rot, dann zurückgesetzt). Volles Gate: Jest 621/621 (Referenz 554, +67), Playwright 318 passed/2 skipped/0 failed (Referenz 317, +1).
- **Task 3 (WR-01, WR-02, Register vollständig):** elf neue Registerzeilen T-10-30..T-10-40 (vier `mitigate`, sieben `accept`) + AR-10-06..AR-10-12 in `10-SECURITY.md`, neue Audit-Historie-Zeile, erneuerte Freigabe. In `SECURITY.md`: fünf Zeilenverweise in Abschnitt 4 gegen den Quelltext NACH allen Änderungen dieses Plans neu bestimmt (siehe Zuordnungstabelle unten), Korrekturdatum `2026-07-26` → `2026-07-25` an vier Stellen (Frontmatter + drei Textstellen — kein Commit trug je das alte Datum), Abschnitt 4 nennt jetzt die Wertprüfung, neuer eigenständiger Befund 7 (CSS-Beacon), sechs neue/präzisierte akzeptierte Restrisiken mit Registerkennung-Querverweis, Suite-Zahlen auf 621/318 aktualisiert.

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Beacon-Regressionstest anlegen** - `65dab7a` (test)
2. **Task 1 (GREEN/fix): Wertprüfung in beiden Sanitizer-Zwillingen** - `ab5cabc` (fix)
3. **Task 2: WR-03/IN-01/Wächtertest/volles Gate** - `e4c7854` (docs)
4. **Task 3: Threat-Register + SECURITY.md korrigiert** - `80a3d93` (docs)

**Plan metadata:** wird mit diesem Commit erzeugt (docs: complete plan)

_Hinweis: Task 1 folgt dem RED→GREEN-Muster als zwei Commits (`test`/`fix`), analog zum tracer/tdd-Vorgehen in Plan 10-06._

## Files Created/Modified

- `utils/basic.js` — `allowedStyleFunctions`/`isSafeStyleValue()` neu, Stil-Filter erweitert (Wertprüfung, Trennung am ersten Doppelpunkt)
- `utils/testable-utils.js` — identische Änderung (Zwilling)
- `tests/unit/security.test.js` — neuer Beacon-Regressionsblock (vm gegen echten Produktions-Sanitizer) + Erlaubnislisten-Wächtertest
- `tests/unit/sanitizer-parity.test.js` — 9 neue Vektoren additiv im gemeinsamen `VECTOR_SET`
- `tests/e2e/features/editor-insert.spec.js` — neuer CSS-Beacon-E2E-Fall mit Netzwerk-Beobachter; drei feste Wartezeiten entfernt (WR-03)
- `ui/editors/rich-text.js` — Kommentar-Korrektur (IN-01), keine Verhaltensänderung
- `.planning/phases/10-security-h-rtung/10-SECURITY.md` — T-10-30..T-10-40 + AR-10-06..AR-10-12 neu, Audit-Historie + Sign-Off erweitert
- `SECURITY.md` — Abschnitt 4 (Zeilenverweise, Wertprüfung), Korrekturdatum, Befund 7, sechs akzeptierte Restrisiken, Suite-Zahlen

## Zuordnungstabelle Zeilenverweise (WR-01)

| Bezeichnung | Datei | Alte Zahl (SECURITY.md vor diesem Plan) | Neue Zahl | Prüfbefehl |
|---|---|---|---|---|
| `handleEditorPaste()` | `ui/editors/rich-text.js` | 952 | 960 | `sed -n '960p' ui/editors/rich-text.js` → `function handleEditorPaste(e) {` |
| Kosmetik-Kette (Bereich) | `ui/editors/rich-text.js` | ~968-994 | 970-1011 | Start/Ende manuell verifiziert (Kommentarzeile 970, schließende `;` der Ersetzungskette Zeile 1011) |
| `insertHtmlAtSelection()` | `ui/editors/rich-text.js` | 850 | 858 | `sed -n '858p' ui/editors/rich-text.js` → `function insertHtmlAtSelection(htmlString) {` |
| Link-Einfügen `prompt()` | `ui/editors/rich-text.js` | 1240 | 1286 | `sed -n '1286p' ui/editors/rich-text.js` → `const url = prompt('URL eingeben:', 'https://');` |
| `saveSpell()` | `ui/editors/rich-text.js` | 1632 | 1678 | `sed -n '1678p' ui/editors/rich-text.js` → `function saveSpell() {` |
| `sanitizeHTML(descHtml)` | `ui/editors/rich-text.js` | 1684 | 1730 | `sed -n '1730p' ui/editors/rich-text.js` → `description: sanitizeHTML(descHtml),` |
| `sanitizeHTML()` Beginn | `utils/basic.js` | 58 | 58 (unverändert) | `sed -n '58p' utils/basic.js` → `function sanitizeHTML(html) {` |
| `allowedTags` | `utils/basic.js` | 72 | 72 (unverändert) | `sed -n '72p' utils/basic.js` → `const allowedTags = [` |
| Ereignis-Attribut-Sperre | `utils/basic.js` | 150 | 178 | `sed -n '178p' utils/basic.js` → `if (attrName.startsWith('on')) continue;` |
| Formprüfung des Verweisziels | `utils/basic.js` | 168ff. | 202ff. | `sed -n '202p' utils/basic.js` → `else if (attrName === 'href' && ...` |

Die vier `rich-text.js`-Verweise verschieben sich um netto +8 (durch die IN-01-Kommentar-Korrektur in Task 2, +2 Zeilen unterhalb der Sanitisierungsstufe für die Zeilen unterhalb des Bearbeitungspunkts) plus die bereits vor diesem Plan bestehende Verschiebung durch Plan 10-06 (WR-01 ursprünglich als 952→960 etc. vom Code-Review vorgeschlagen — diese vier Werte waren zum Zeitpunkt des Reviews bereits korrekt und blieben es, da mein Task-2-Edit unterhalb ihrer Position liegt außer bei Link/saveSpell/sanitizeHTML, die um +2 verschoben). Die zwei `basic.js`-Verweise (150→178, 168→202) verschieben sich durch die Task-1-Ergänzung von `allowedStyleFunctions`/`isSafeStyleValue()` (28 neue Zeilen vor `cleanNode`).

## Zuordnungstabelle Datumsangaben (WR-02)

| Ereignis | Datum in SECURITY.md (vorher) | Korrektes Datum | Beleg |
|---|---|---|---|
| Plan-10-06-Gap-Closure-Korrektur | `2026-07-26` (Frontmatter `audit_date` + 3 Textstellen) | `2026-07-25` | `git log` aller Plan-10-06-Commits: `ce6751f`/`46832f3`/`fbd1433`/`2836422`/`b908362`, alle `2026-07-25` |
| Plan-10-07-Gap-Closure-Runde-2-Korrektur (dieser Plan) | — (neu) | `2026-07-25` | `git log` aller Plan-10-07-Commits bis hierhin: `65dab7a`/`ab5cabc`/`e4c7854`/`80a3d93`, alle `2026-07-25` |

Regel bestätigt: jede Datumsangabe in `SECURITY.md` datiert jetzt ein Ereignis, für das ein Commit mit genau diesem Datum existiert; `grep -n "^audit_date:" SECURITY.md` zeigt `2026-07-25`.

## Zählnachweis fixierte Positionierung (T-10-33)

```
grep -rn "position:\s*fixed" assets/styles/*.css assets/styles.css | wc -l
→ 34
```
Alle 34 Fundstellen einzeln gesichtet (Datei:Zeile-Liste in der Bash-Historie dieser Sitzung); Zählweise: jede Deklaration `position: fixed` bzw. `position: fixed !important` in den CSS-Quelldateien unter `assets/styles/` und `assets/styles.css`, unabhängig von Selektor-Verschachtelung.

## Decisions Made

Siehe `key-decisions` im Frontmatter oben (background vs. background-image als Vektor-Eigenschaft; Tabellen-Wrapper gegen Foster-Parenting in Unit-Tests; Stil-Attribut-Notation als E2E-Achse statt url()-Wert-Notation; allowedStyleFunctions-Zusammensetzung; Restrisiken dokumentiert statt behoben).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Erste Fassung der Angriffsvektoren reproduzierte den Bug nicht**
- **Found during:** Task 1, Schritt 1 (RED anlegen)
- **Issue:** Erste Version der Unit-Vektoren nutzte `background-image:url(...)` als Angriffs-Eigenschaft und freistehende `<td style="...">`-Fragmente. `background-image` steht nicht auf `allowedAttributes.style` und wurde daher schon vom BESTEHENDEN Eigenschaftsnamen-Filter blockiert (kein Beweis für die zu schließende Lücke); freistehende `<td>`-Elemente werden vom HTML5-Parser außerhalb eines Tabellenkontexts verworfen (Foster-Parenting), wodurch auch die Erhaltungs-Gegenproben fälschlich rot liefen.
- **Fix:** Vektoren auf die Eigenschaft `background` umgestellt (die tatsächlich betroffene, bereits erlaubte Eigenschaft) und alle Payloads in `<table><tr><td>...</td></tr></table>` gewrappt.
- **Files modified:** tests/unit/security.test.js, tests/unit/sanitizer-parity.test.js
- **Verification:** Roter Lauf danach zeigte die erwarteten 9 Fehlschläge (8 Angriffsvektoren + Teil-Erhaltung) bei 5 grünen Erhaltungsvektoren.
- **Committed in:** 65dab7a (Task 1 RED-Commit, vor dem finalen roten Lauf korrigiert)

**2. [Rule 1 - Bug] E2E-Testpayload reproduzierte den Bug nicht (identische Ursache, andere Ebene)**
- **Found during:** Task 1, Schritt 1b (E2E RED anlegen)
- **Issue:** Erste E2E-Payload nutzte für alle drei Notationsformen `style="background:url(...)"` (durchgehend doppelt quotiert). Die kosmetische Attribut-Entfernungskette in `handleEditorPaste()` entfernt JEDES doppelt quotierte `style="..."`-Attribut, bevor der Sanitizer überhaupt läuft (D-01/T-10-39) — der Test lief grün gegen den ungepatchten Stand, ohne dass ein Netzwerk-Request beobachtet wurde.
- **Fix:** Payload auf drei unterschiedliche Notationsformen DES STIL-ATTRIBUTS umgestellt (Zelle 1 doppelt quotiert als Kontrollzelle, Zelle 2 einfach quotiert, Zelle 3 unquotiert) — genau die Form, die laut Plan-Behavior-Spezifikation geprüft werden sollte.
- **Files modified:** tests/e2e/features/editor-insert.spec.js
- **Verification:** Diagnose-Lauf bestätigte nicht-leere Anfragesammlung (`LEAK-SQ`, `LEAK-UQ`); benannter Testfall lief rot an der strukturellen Marker-Prüfung.
- **Committed in:** 65dab7a (Task 1 RED-Commit, vor dem finalen roten Lauf korrigiert)

---

**Total deviations:** 2 auto-fixed (beide Rule 1 — Testvektor-Konstruktionsfehler VOR dem finalen roten Commit korrigiert, kein Produktionscode betroffen, keine nachträgliche Testabschwächung)
**Impact on plan:** Beide Korrekturen betrafen ausschließlich Testfixture-Konstruktion, bevor der rote Lauf für die SUMMARY erfasst wurde — die zitierten RED-Ausgaben oben stammen bereits von den korrigierten Fassungen. Kein Scope-Creep, keine Abweichung von Plan-Vorgaben.

## Issues Encountered

None — alle Deviations sind unter "Deviations from Plan" dokumentiert (Testkonstruktion, kein Produktionsverhalten).

## User Setup Required

None — keine externe Service-Konfiguration nötig.

## Next Phase Readiness

- SC3-Nachfolge-Lücke (der von zwei Prüfern während der 10-06-Verifikation unabhängig gefundene CSS-Beacon) ist geschlossen: Wertprüfung pro Stil-Deklaration in beiden Sanitizer-Zwillingen, Beleg rot→grün auf beiden Testebenen (Unit + E2E).
- Alle vier Funde aus `10-REVIEW-GAP.md` behoben: WR-01 (Zeilenverweise nachgerechnet), WR-02 (Datumsangaben an Commits gebunden), WR-03 (feste Wartezeiten aus den 10-06-Fällen entfernt), IN-01 (Protokollliste vollständig).
- `threats_open: 0` ist in `SECURITY.md` und `10-SECURITY.md` wieder wahr — nicht durch Weglassen, sondern weil jeder bekannte Restrisiko-Punkt dieser Fläche (a-f aus der Objective, plus die Quote-Asymmetrie) eine Registerzeile mit Disposition und schriftlicher Begründung trägt (D-12).
- SEC-01 und SEC-02 bleiben vollständig erfüllt (beide Requirements bereits von früheren Plänen deklariert; dieser Plan schließt eine zweite, unabhängig gefundene Lücke auf derselben Fläche).
- Phase 10 (Security-Härtung) ist mit diesem Plan inhaltlich abgeschlossen — bereit für die abschließende Phasen-Verifikation.
- Scope-Zaun gewahrt: `git diff --name-only` über alle vier Task-Commits dieses Plans (`fd1dcd5..HEAD`) zeigt ausschließlich die acht in `files_modified` genannten Dateien — keine Berührung der Original-10-REVIEW.md-Funde, keine Rücknahme von Plan 10-06, keine Behebung der bewusst akzeptierten Restrisiken.

---
*Phase: 10-security-h-rtung*
*Completed: 2026-07-25*

## Self-Check: PASSED

- FOUND: utils/basic.js
- FOUND: utils/testable-utils.js
- FOUND: tests/unit/security.test.js
- FOUND: tests/unit/sanitizer-parity.test.js
- FOUND: tests/e2e/features/editor-insert.spec.js
- FOUND: ui/editors/rich-text.js
- FOUND: .planning/phases/10-security-h-rtung/10-SECURITY.md
- FOUND: SECURITY.md
- FOUND: commit 65dab7a (test: Task 1 RED)
- FOUND: commit ab5cabc (fix: Task 1 GREEN)
- FOUND: commit e4c7854 (docs: Task 2)
- FOUND: commit 80a3d93 (docs: Task 3)
