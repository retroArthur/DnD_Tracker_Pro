---
phase: 15-befundlage-vorlauf
plan: 12
subsystem: testing
tags: [css-usage-report, dead-css, static-analysis, tdd, regression-audit]

# Dependency graph
requires:
  - phase: 15-befundlage-vorlauf (Plan 15-11)
    provides: Erweiterte Lebend-Erkennung (Interpolations-Ernte, Zeichen-Obergrenze, Zwischenvariablen-Kontext) in tools/css-usage-report.js, verwendet von der Gegenprobe dieses Plans
provides:
  - "Versionierte Klassenmenge vor der Loeschwelle (tests/fixtures/css-classes-before-15-07.json, Bezugscommit 09cb913, 2754 Klassen) und ein dauerhafter Waechtertest (tests/unit/css-deletion-audit.test.js, DEL-01/DEL-02/DEL-03), der ab jetzt bei jedem Jest-Lauf jede Fehlloeschung in assets/styles/ gegen den GESAMTEN historischen Bestand prueft"
  - "Acht woertlich wiederhergestellte CSS-Regelbloecke (sechs Klassenfamilien) in loot.css/welt.css/initiative.css/npcs.css/dashboard.css, jeweils mit Herkunftscommit und Zeilenspanne belegt"
  - "Neue, evidenzbasierte KNOWN_FALSE_POSITIVES-Ausnahmeliste (DEAD_EXCEPTIONS-Analogon) im Testfile fuer 15 bestaetigte Fehlalarme der concat-var-Erkennungsregel aus Plan 15-11 — jede einzeln per Nachverfolgung belegt, keine pauschale Geltungsbereichs-Reduktion"
  - "Bereinigtes Befundregister (.planning/WINDOWS.md): Eintrag 6 traegt eine Korrekturnotiz statt eines irrefuehrend vollstaendigen fixed-Status, neuer Eintrag 7 schliesst die CR-01/CR-02/CR-03-Geschichte, Eintrag 5 traegt die frisch gemessene Endzahl (159 statt 199)"
affects: [16-css-dead-code-entfernung, 17-css-dead-code-entfernung, 18-css-dead-code-entfernung, 19-css-dead-code-entfernung, future-css-usage-report-detector-fix]

# Actuals (#2632)
actuals:
  tokens: 25830
  tasks: 3
  commits: 10
plan_head_before: f660ddba45eb666e1b9f36aad27e43f88151fbbd

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ein dauerhafter, versionierter Gegenprobe-Test (Fixture + Waechtertest) statt einer einmaligen Handpruefung, nach dem Formvorbild von docs-consistency.test.js"
    - "Evidenzbasierte, dated+reasoned Ausnahmeliste innerhalb eines TESTS (nicht der Produktionsdatei) fuer bestaetigte Detektor-Fehlalarme, analog zu DEAD_EXCEPTIONS"
    - "Instrumentierte Wegwerf-Kopie eines Werkzeugs (nicht committet) zur Provenienz-Nachverfolgung einzelner Erkennungstreffer, bevor eine Restaurierungs- oder Ausnahme-Entscheidung getroffen wird"

key-files:
  created:
    - tests/fixtures/css-classes-before-15-07.json
    - tests/unit/css-deletion-audit.test.js
  modified:
    - assets/styles/loot.css
    - assets/styles/welt.css
    - assets/styles/initiative.css
    - assets/styles/npcs.css
    - assets/styles/dashboard.css
    - .planning/WINDOWS.md
    - .planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md
    - .planning/phases/15-befundlage-vorlauf/deferred-items.md

key-decisions:
  - "Der volle Gegenprobe-Lauf nannte 22 statt der sechs erwarteten Klassenfamilien. Per instrumentierter Nachverfolgung (Wegwerf-Kopie von collectLiveTokens() mit Provenienz-Logging, siehe Abschnitt 'Detektor-Fehlalarm entdeckt') wurde belegt: 8 Klassen (6 Familien) sind echte Fehlloeschungen und wurden woertlich wiederhergestellt; die restlichen 15 sind reproduzierbare Fehlalarme von collectConcatVarLiterals() (Plan 15-11), nicht echte Fehlloeschungen — sie wurden NICHT als CSS wiederhergestellt (das haette genuinely-totes CSS zurueckgeholt, teils in Dateien ausserhalb des files_modified dieses Plans), sondern als datierte, einzeln begruendete Ausnahmeliste direkt im Testfile gefuehrt"
  - "tools/css-usage-report.js selbst wurde NICHT geaendert (Planvorgabe) — die Korrektur des Detektor-Fehlalarms (Konkatenation statt blosser Woertlich-Ko-Vorkommen im Anweisungsfenster verlangen) ist eine architektonische Aenderung (Rule 4) und als eigener, neuer Befund vertagt (deferred-items.md Eintrag 6)"
  - "Register-Korrektur statt Ueberschreibung: WINDOWS.md-Eintrag 6 behaelt seinen historisch zutreffenden fixed-Status (Plan 15-09 hat geleistet, was es behauptet), bekommt aber einen Korrekturhalbsatz, der klarstellt, dass sich der Status nur auf den damals bekannten Teilbefund bezog — GATE-04 verbietet, einen teilweise geschlossenen Befund als vollstaendig geschlossen zu behaupten, nicht aber, einen damals wahren Status rueckwirkend als falsch zu markieren"

patterns-established:
  - "Bei einem Erkennungs-/Detektorfund, der ueber die Planungsgroesse hinausgeht: erst Provenienz jedes einzelnen Treffers nachverfolgen (nicht pauschal restaurieren oder pauschal verwerfen), dann getrennt behandeln — echte Regressionen woertlich wiederherstellen, bestaetigte Fehlalarme dokumentiert ausnehmen"

requirements-completed: [DEAD-01, DEAD-02, DEAD-03, GATE-03, GATE-04]

coverage:
  - id: D1
    description: "Automatisierte Gegenprobe des gesamten Phase-15-Loeschstands als dauerhafter Testfall (DEL-01/DEL-02/DEL-03)"
    requirement: GATE-03
    verification:
      - kind: unit
        ref: "tests/unit/css-deletion-audit.test.js (3 passed, 3 total)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Sechs Klassenfamilien (acht Regelbloecke) woertlich aus ihrem Herkunftscommit in loot.css/welt.css/initiative.css/npcs.css/dashboard.css wiederhergestellt"
    requirement: DEAD-01
    verification:
      - kind: unit
        ref: "tests/unit/css-deletion-audit.test.js#DEL-02, node tools/css-usage-report.js --json (checkFailures ohne die acht Klassen)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Befundregister (WINDOWS.md) korrigiert: kein Eintrag behauptet mehr einen vollstaendigen Abschluss, den er nicht hat; frisch gemessene Endzahl (159) an beiden Darstellungsstellen identisch"
    requirement: GATE-04
    verification:
      - kind: other
        ref: "grep -cE \"^(open_count: 3|fixed_count: 4|total_count: 7)$\" .planning/WINDOWS.md -> 3; grep -c css-deletion-audit .planning/WINDOWS.md -> 2"
        status: pass
    human_judgment: false
  - id: D4
    description: "Volle Jest-/Playwright-/pytest-Suiten und beide Builds gruen nach der CSS-Wiederherstellung"
    requirement: GATE-03
    verification:
      - kind: unit
        ref: "npx jest (1260 passed, 1260 total)"
        status: pass
      - kind: e2e
        ref: "npx playwright test --reporter=list (364 passed, 2 skipped, 0 failed)"
        status: pass
      - kind: other
        ref: "python -m pytest tests/build -q (24 passed); python build.py und python build.py --production (beide Exit 0)"
        status: pass
    human_judgment: false

duration: 130min
completed: 2026-09-11
status: complete
---

# Phase 15 Plan 12: Gegenprobe des gesamten Loeschstands, Wiederherstellung, Detektor-Fehlalarm entdeckt Summary

**Automatisierte Gegenprobe (`css-deletion-audit.test.js`) des gesamten Phase-15-Loeschstands eingefuehrt, acht echte Fehlloeschungen (sechs Klassenfamilien) woertlich wiederhergestellt, und als unerwarteten Nebenfund einen reproduzierbaren Fehlalarm in der Plan-15-11-Erkennungserweiterung (`collectConcatVarLiterals()`) fuer 15 weitere Klassennamen belegt und dokumentiert — ohne das Werkzeug selbst anzufassen.**

## Performance

- **Duration:** ~130 min
- **Tasks:** 3
- **Files modified:** 10 (2 neu: Fixture + Waechtertest; 5 CSS-Dateien; 3 Dokumente)
- **Commits:** 10

## Accomplishments

- **Versionierte Vergleichsdatei:** `tests/fixtures/css-classes-before-15-07.json` — 2754 sortierte, dublettenfreie Klassennamen aus `assets/styles/*.css` am Commit `09cb913dc389bda68ceb04df3cd46f5dfcd60b6b` (unmittelbar vor `fb54b3e`, dem ersten Loeschcommit von Plan 15-07). Erzeugungsbefehl (woertlich, siehe unten) ist reproduzierbar.
- **Dauerhafter Waechtertest:** `tests/unit/css-deletion-audit.test.js` mit drei Faellen (`DEL-01`, `DEL-02`, `DEL-03`), nach dem Formvorbild von `docs-consistency.test.js`. Benutzt ausschliesslich `collectCssClasses()`/`collectLiveTokens()` aus `tools/css-usage-report.js` — kein zweites Zaehlverfahren. Faehrt ab jetzt bei jedem `npx jest`-Lauf mit.
- **Roter Vorlauf (vor jeder Restaurierung):** `DEL-02` nannte **22 Klassen**, nicht die sechs aus `15-REVIEW.md` CR-01 erwarteten Familien — DEAD-02 verlangt ausdruecklich die Pruefung des GESAMTEN Loeschstands, nicht nur der bekannten Faelle, und der rote Lauf hat genau das geliefert.
- **Acht Regelbloecke (sechs Familien) woertlich wiederhergestellt:** siehe Tabelle unten, je mit Herkunftscommit und Zeilenspanne.
- **Detektor-Fehlalarm entdeckt und belegt (NEUER Befund, ueber die Planung hinaus):** die restlichen 15 der 22 roten Namen sind KEINE echten Fehlloeschungen, sondern ein reproduzierbarer Fehlalarm von `collectConcatVarLiterals()` (Plan 15-11, CR-03b) — siehe eigener Abschnitt unten. Dokumentiert als datierte `KNOWN_FALSE_POSITIVES`-Ausnahmeliste im Testfile (nicht im Werkzeug) und als neuer `deferred-items.md`-Eintrag.
- **Frisch gemessener Pruefmodus-Stand:** `checkFailures.length` bleibt bei **159** (unveraendert gegenueber Messblock 10 — die Restaurierungen betrafen ausschliesslich bereits als lebendig erkannte Klassen).
- **Register bereinigt:** `.planning/WINDOWS.md` Eintrag 6 traegt eine Korrekturnotiz statt eines irrefuehrenden vollstaendigen `fixed`; neuer Eintrag 7 (`fixed`) schliesst die CR-01/CR-02/CR-03-Geschichte und nennt die Gegenprobe als dauerhafte Abhilfe; Eintrag 5 traegt die frische Zahl 159. `open_count: 3`, `fixed_count: 4`, `total_count: 7`.
- **Alle Suiten und beide Builds gruen** nach der Wiederherstellung: Jest 1260/1260, Playwright 364 passed/2 skipped/0 failed, pytest 24/24, Dev- und Produktionsbuild beide Exit 0.

## Erzeugungsbefehl der Vergleichsdatei (woertlich)

Kein Shell-Einzeiler — ein kleines Node-Skript (siehe `tools/css-usage-report.js`s `collectCssClasses()`),
das fuer jede `.css`-Datei aus `git ls-tree --name-only 09cb913dc389bda68ceb04df3cd46f5dfcd60b6b:assets/styles`
den Inhalt per `git show 09cb913dc389bda68ceb04df3cd46f5dfcd60b6b:assets/styles/<name>` liest,
`collectCssClasses()` darauf anwendet, die Vereinigungsmenge bildet, sortiert, und als
`{ base_ref, base_subject, generated, classes }` nach `tests/fixtures/css-classes-before-15-07.json`
schreibt. `base_ref` = `09cb913dc389bda68ceb04df3cd46f5dfcd60b6b`, `base_subject` = "docs(15-06): complete
css-usage-report and computed-style-diff plan" (der Commit-Betreff). Ergebnis: 2754 Klassen aus 20
Dateien.

## Rot-Gruen-Protokoll (GATE-03)

```
Task 1 — DEL-02 gegen den unveraenderten Baum:
npx jest tests/unit/css-deletion-audit.test.js
Tests:       1 failed, 2 passed, 3 total
Exit-Code:   1
DEL-02 nennt 22 Klassen: description, dice-char-select, dice-crit, dice-fail,
dice-formula-history, dice-history, divider, enc-search, encounter,
fr-hist-minus, fr-hist-plus, init-mob-dmg-inputs, loc-search, loot,
loot-search, npc-header, npc-search, party, shop-meta-tag, timer-list,
timer-name, timer-presets

Task 2 — nach Wiederherstellung der acht genuinen Regelbloecke UND
Dokumentation der 15 Detektor-Fehlalarme als KNOWN_FALSE_POSITIVES:
npx jest tests/unit/css-deletion-audit.test.js
Tests:       3 passed, 3 total
Exit-Code:   0
```

Klassenzahlen aus der Gegenprobe selbst: 2754 vor der Loeschwelle, 2227 heute, 527 geloescht
(DEL-03, nicht leer).

## Woertlich wiederhergestellte Regelbloecke

| Klasse(n) | Datei | Herkunftscommit (Loeschcommit^, Elternstand) | Zeilenspanne im Elternstand |
|---|---|---|---|
| `.shop-meta-tag`, `:hover`, `.npc`, `.location` | `assets/styles/loot.css` | `4ed26ad9b4fdefb9294e93120b39c29ba40c56ab^` | 349-365 |
| `.si-unavailable` (Basisregel) | `assets/styles/loot.css` | `4ed26ad9b4fdefb9294e93120b39c29ba40c56ab^` | 650-652 |
| `.fr-hist-plus`, `.fr-hist-minus` | `assets/styles/welt.css` | `c83b8cca10461dae15e0a8f756a3e3e9c21555cc^` | 1127-1133 |
| `.init-mob-dmg-inputs`, `.hidden`, `input` | `assets/styles/initiative.css` | `2fc147ed2459e1f9908e437076af63d5adfe1487^` | 1153-1173 |
| `.npc-header` | `assets/styles/npcs.css` | `e743f8d6bb99cb92626d906ab044c710d9845d8d^` | 1191-1198 |
| `.dice-crit`, `.dice-fail` | `assets/styles/dashboard.css` | `a37e17e7aac46ca70224971d80ad71a4b51af369^` | 168-169 |

Jede Zeile wurde per `git show <commit>^:<datei>` woertlich entnommen und an der im Plan benannten
(bzw. dem naechsten ueberlebenden) Kaskadenanker eingesetzt. Zwei Faelle (`.npc-header`,
`.dice-crit`/`.dice-fail`) haben heute keine Laufzeitwirkung (unerreichbarer JS-Pfad) — bewusst
trotzdem wiederhergestellt statt den JS-Pfad mitzuloeschen, siehe `deferred-items.md` Eintrag 4.

## Detektor-Fehlalarm entdeckt (neuer Befund, ueber die Planung hinaus)

Der rote Lauf aus Task 1 nannte 22 statt der sechs erwarteten Klassenfamilien. Statt pauschal alle
22 zu restaurieren (was genuinely-totes CSS zurueckgeholt haette, teils in Dateien ausserhalb
dieses Plans `files_modified`), wurde jeder der 15 zusaetzlichen Namen per instrumentierter
Wegwerf-Kopie von `collectLiveTokens()` (mit Provenienz-Logging pro Regel/Datei, nicht committet)
bis zur exakten Fundstelle zurueckverfolgt.

**Befund:** Alle 15 gehen auf dieselbe Ursache zurueck — `collectConcatVarLiterals()` (Plan 15-11,
CR-03b) deklariert fuer JEDEN `var`/`let`/`const`-Bezeichner im Dateiinhalt dessen
Zeichenketten-Literale (auch wenn der Bezeichner z. B. nur eine `$('irgendeine-id')`-Element-ID-
Referenz oder ein voellig unabhaengiges Array/Objekt ist), und der anschliessende
Vorwaertsscan ab einem `class="..."`-Vorkommen (bis 2000 Zeichen oder das naechste `;`, nur
klammertiefen-/anfuehrungszeichen-gebunden, NICHT statement-semantik-bewusst) kann in einer
grossen, template-literal-zurueckgebenden Funktion mit verschachtelten Callbacks weit genug
reichen, um einen voellig unabhaengigen, spaeter deklarierten Bezeichner faelschlich aufzugreifen —
ohne zu pruefen, ob tatsaechlich eine Verkettung stattfindet.

Beispiele (vollstaendige Liste mit Beleg je Klasse: `deferred-items.md` Eintrag 6):
- `const c = $('dice-formula-history')` / `const c = $('dice-history')` (`dice-core.js`) — reine
  Element-ID-Referenzen, keine Klassenverkettung.
- `const viewMap = { characters: 'party', encounters: 'encounter', loot: 'loot', ... }`
  (`entity-links.js`) — eine View-Namen-Zuordnungstabelle fuer `switchView()`, keine CSS-Klasse.
- `const searchEl = $('enc-search')` / `$('loc-search')` / `$('npc-search')` und
  `const searchInput = $('loot-search')` — vier weitere Element-ID-Referenzen.

**Entscheidung:** Diese 15 Klassen wurden NICHT als CSS wiederhergestellt. Stattdessen: eine
datierte, individuell begruendete `KNOWN_FALSE_POSITIVES`-Ausnahmeliste direkt in
`tests/unit/css-deletion-audit.test.js` (analog zu `DEAD_EXCEPTIONS` im Werkzeug selbst, aber ohne
das Werkzeug zu aendern — Planvorgabe dieser Welle verbietet Aenderungen an
`tools/css-usage-report.js`). Diese Liste schraenkt NICHT den Geltungsbereich der Gegenprobe auf
"bereits bekannte Faelle" ein (DEAD-02-Verbot) — jeder Eintrag ist einzeln evidenzbasiert; eine
kuenftige, ECHTE Fehlloeschung unter einem ANDEREN Klassennamen bleibt weiterhin rot. Die
Detektor-Korrektur selbst (Konkatenation statt blosser Woertlich-Ko-Vorkommen im Anweisungsfenster
verlangen) ist eine architektonische Aenderung (Rule 4) und als eigener, neuer Befund vertagt.

## Task Commits

1. **Task 1: Gegenprobe automatisieren (RED)** — `447043f` test(15-12): add versioned pre-wave class snapshot and css-deletion-audit guard (RED)
2. **Task 2: Sechs Klassenfamilien wiederherstellen (GREEN), je Datei ein Commit** —
   - `b830490` fix(15-12): restore shop-meta-tag and si-unavailable rules in loot.css
   - `083ab78` fix(15-12): restore fr-hist-plus and fr-hist-minus rules in welt.css
   - `53c19a0` fix(15-12): restore init-mob-dmg-inputs rules (incl. hidden) in initiative.css
   - `de3571c` fix(15-12): restore npc-header rule in npcs.css
   - `1473706` fix(15-12): restore dice-crit and dice-fail rules in dashboard.css
   - `f4d66bb` fix(15-12): document 15 confirmed collectConcatVarLiterals false positives (GREEN)
3. **Task 3: Register bereinigen, neu messen, Restpunkte vertagen, volle Abnahme fahren** —
   - `e6d467f` docs(15-12): correct register entries, add Messblock 11, log detector false-positive finding
   - `d7a0ea7` fix(15-12): avoid literal module-exception paths in css-deletion-audit reasons (Rule 1 Auto-Fix, siehe Deviations)

**Plan metadata:** (dieser Commit, siehe unten)

## Files Created/Modified

- `tests/fixtures/css-classes-before-15-07.json` — versionierte Klassenmenge vor der Loeschwelle
- `tests/unit/css-deletion-audit.test.js` — Waechtertest DEL-01/02/03 + KNOWN_FALSE_POSITIVES
- `assets/styles/loot.css` — `.shop-meta-tag`-Familie + `.si-unavailable`-Basisregel
- `assets/styles/welt.css` — `.fr-hist-plus`/`.fr-hist-minus`
- `assets/styles/initiative.css` — `.init-mob-dmg-inputs`-Familie inkl. `.hidden`
- `assets/styles/npcs.css` — `.npc-header`
- `assets/styles/dashboard.css` — `.dice-crit`/`.dice-fail`
- `.planning/WINDOWS.md` — Eintrag 6 korrigiert, Eintrag 7 neu (fixed), Eintrag 5 frisch gemessen
- `.planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md` — `## Messblock 11`
- `.planning/phases/15-befundlage-vorlauf/deferred-items.md` — drei neue Eintraege (4, 5, 6)

## Decisions Made

- Siehe `key-decisions` im Frontmatter (drei Entscheidungen: Restaurierung vs. Ausnahmeliste je
  nach Provenienz-Nachweis; keine Werkzeugaenderung trotz gefundenem Detektor-Fehlalarm;
  Register-Korrektur statt Ueberschreibung bei Eintrag 6).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Literale Modul-Ausnahme-Pfade in Test-Kommentaren brachen die Coverage-Ratsche**
- **Found during:** Task 3, Schritt FUENFTENS (volle Suiten fahren)
- **Issue:** Sieben `KNOWN_FALSE_POSITIVES`-Begruendungen nannten `MODULE_TEST_EXCEPTIONS`-Eintraege
  als zusammengesetzte Pfad-Strings (z. B. `features/dice/dice-core.js`).
  `tests/unit/module-test-coverage.test.js` behandelt jedes woertliche Vorkommen eines solchen
  Pfads unter `tests/` als "abgedeckt", unabhaengig davon, ob ein Test das Modul tatsaechlich laedt
  — dieselbe Fehlerklasse, die Plan 15-11 bereits einmal traf. Das kippte sieben Eintraege
  faelschlich auf "abgedeckt" und brach die Ratsche.
- **Fix:** Auf dieselbe sichere Konvention umgestellt, die `module-test-coverage.test.js`s eigene
  CR-01a/b-Kommentare bereits verwenden (`dice-core.js (im features/dice/-Verzeichnis)` statt
  `features/dice/dice-core.js`). Kein Testverhalten geaendert.
- **Files modified:** `tests/unit/css-deletion-audit.test.js`
- **Verification:** `npx jest` -> 1260 passed, 1260 total (vorher 1 failed, 1259 passed)
- **Committed in:** `d7a0ea7`

**2. [Rule 3 - Blocking, per Shell-Escape] `gsd_run windows.append` mangled Pfad-artigen Text in der Beschreibung**
- **Found during:** Task 3, Schritt ZWEITENS(a)
- **Issue:** Git Bash (MSYS) interpretierte den woertlichen Text `class=/.className=/containerClass:/.className+=`
  in der `--description`-Argumentzeichenkette als Windows-Pfad-artige Zeichenkette und wandelte ihn
  in `class=C:\Program Files\Git\.className=\containerClass;...` um, bevor der Node-Prozess ihn sah.
- **Fix:** Den betroffenen Text direkt in `.planning/WINDOWS.md` (Tabellenzeile UND JSON-Objekt,
  zeichengleich) per Edit korrigiert, VOR dem `windows fixed 7`-Aufruf. Keine Zahlangabe war
  betroffen (die Fehlalarm-Schranke gegen doppelte Zahlangaben griff nicht, weil der Fehler reine
  Pfadzeichen betraf).
- **Files modified:** `.planning/WINDOWS.md`
- **Verification:** `grep -c "css-deletion-audit" .planning/WINDOWS.md` -> 2; kein `C:\Program Files`
  mehr im Dokument
- **Committed in:** `e6d467f`

---

**Total deviations:** 2 auto-fixed (1 Rule 1 — eigene Testdatei-Regression sofort gefixt, 1 Rule 3 —
Shell-Escape-Fehler sofort korrigiert, vor jedem Commit).
**Impact on plan:** Beide Auto-Fixes waren noetig, um die eigenen Akzeptanzkriterien dieses Plans zu
erfuellen; kein Scope-Creep.

**Ausserdem — Abweichung von einer PLANUNGSGROESSE (kein Auto-Fix, sondern eine dokumentierte
Entscheidung):** Der Plan erwartete ausdruecklich "mindestens die sechs Klassenfamilien" und sah
in SIEBTENS vor, dass ZUSAETZLICHE rote Namen "nach derselben Regel behandelt" werden
(Herkunftscommit ermitteln, Block woertlich zurueckholen). Der tatsaechliche rote Lauf nannte 22
statt 6-7 Namen. Statt alle 22 blind zu restaurieren, wurden die 15 zusaetzlichen per Provenienz-
Nachverfolgung als Detektor-Fehlalarm identifiziert (siehe Abschnitt oben) und stattdessen als
Ausnahmeliste dokumentiert. Dies ist eine bewusste Abweichung von der woertlichen SIEBTENS-Anweisung,
begruendet durch den Fund selbst: eine pauschale Restaurierung haette (a) genuinely-totes CSS
zurueckgeholt, (b) teils Dateien ausserhalb des `files_modified` dieses Plans angefasst
(`dice.css`, `dmscreen.css`, `encounters.css`, `core.css` waeren betroffen gewesen), und (c) den
eigentlichen Befund (einen Detektor-Bug) verschleiert statt ihn sichtbar zu machen.

**Zusaetzlich — Zaehler-Diskrepanz in `deferred-items.md` (dokumentiert, nicht verborgen):** Task 3s
Akzeptanzkriterium erwartete nach dieser Welle genau 4 `- **Status:**`-Eintraege (der Plan ging von
einem 2-Eintraege-Ausgangsstand aus). Tatsaechlich stand die Datei bereits bei 3 Eintraegen (Plan
15-11 hat nach der Planung dieses Plans, aber vor seiner Ausfuehrung, einen dritten Eintrag
ergaenzt), und dieser Plan musste DREI neue Eintraege ergaenzen (die zwei geplanten plus den neu
entdeckten Detektor-Fehlalarm) statt zwei. Tatsaechlicher Endstand: **6** Eintraege, nicht 4. Der
`grep -c "^- \*\*Status:\*\*"`-Check aus dem Plan wuerde folglich `6` statt der erwarteten `4`
liefern — eine stale Planungsgroesse, kein Ausfuehrungsfehler. Dokumentiert hier und im
docs-Commit `e6d467f`.

## Issues Encountered

Keine ueber die oben dokumentierten Deviations hinaus. Die groesste Herausforderung war die
Provenienz-Nachverfolgung der 15 zusaetzlichen roten Namen — geloest durch eine instrumentierte,
nicht committete Wegwerf-Kopie von `tools/css-usage-report.js` mit Provenienz-Logging je Regel,
statt Vermutungen anzustellen.

## User Setup Required

None - keine externe Service-Konfiguration erforderlich.

## Next Phase Readiness

- Die Gegenprobe (`tests/unit/css-deletion-audit.test.js`) faehrt ab jetzt bei jedem Jest-Lauf mit
  und wird jede Fehlloeschung der Phasen 16-19 rot machen, statt sie bis zur naechsten manuellen
  Verifikation unbemerkt zu lassen.
- Der neu entdeckte Detektor-Fehlalarm in `collectConcatVarLiterals()` (Plan 15-11) ist als
  `deferred-items.md` Eintrag 6 offen dokumentiert — betrifft NICHT die Korrektheit der Gegenprobe
  heute (alle 15 falsch-positiven Namen sind per Ausnahmeliste sauber ausgenommen), aber eine
  kuenftige Phase, die `tools/css-usage-report.js` architektonisch anfasst, sollte diesen Fund
  sehen, bevor sie die concat-var-Regel erweitert oder darauf aufbaut.
- GATE-05 Stufe 3 (die menschliche Vier-Themes-Sichtung) wurde durch diesen Plan **NICHT**
  durchgefuehrt — dieser Plan aendert ausgeliefertes CSS, aber die menschliche Runde bleibt
  ausdruecklich Plan 15-14 vorbehalten.
- Bereit fuer Plan 15-13/15-14.

## Self-Check: PASSED

---
*Phase: 15-befundlage-vorlauf*
*Completed: 2026-09-11*
