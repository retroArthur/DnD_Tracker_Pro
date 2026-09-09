---
phase: 15-befundlage-vorlauf
plan: 06
subsystem: css-testing
tags: [css, node, playwright, jest, dead-code-detection, ratchet, computed-style]

# Dependency graph
requires:
  - phase: 15-01
    provides: "Ratschen-Beweisprotokoll (D-49-Checkliste) als Formvorbild fuer beidseitig bewiesene Grenzwerte"
  - phase: 15-04
    provides: "tests/e2e/features/design-fixes.spec.js als erwartete Abweichungsquelle im Computed-Style-Diff (dms-terrain-item, dms-skill-header, dms-know-skill, dms-know-types)"
  - phase: 15-05
    provides: "Zauberplatz-Pips (.slot-pip) und Wuerfelergebnis (.dice-hero-result) als weitere erwartete Abweichungsquellen im Computed-Style-Diff"
provides:
  - "tools/css-usage-report.js — das in D-20 verlangte, abhaengigkeitsfreie Werkzeug mit dreistufiger Lebend-Erkennung, Pruefmodus und maschinenlesbarer Ausgabe"
  - "Die verbindliche Loeschzahl fuer Plan 15-07: 738 tote Klassen (733 ausserhalb der Ausnahmeliste), 757 vollstaendig tote Regelbloecke, 5762 Zeilen — an die Stelle der drei nicht reproduzierbaren kolportierten Zahlen (438/607/~3.174)"
  - "tests/e2e/features/computed-style-diff.spec.js — der Vorher/Nachher-Stildiff in drei Durchgaengen, erster Abzug erhoben und persistiert als Vergleichsstand fuer Plan 15-07"
  - "Die vollstaendige, gemessene Loeschreihenfolge fuer Plan 15-07 (18 Commits) samt PWA-Banner-Sonderfall"
  - "Ein waehrend der Pflicht-Fehlalarm-Pruefung gefundener und behobener Klassifikationsfehler des Werkzeugs (String-Konkatenations-Klassenattribute) sowie 5 dokumentierte, echte Werkzeuggrenzen (Read-Aloud-Farbvarianten) in DEAD_EXCEPTIONS"
affects: ["15-07", "16", "17", "18", "19"]

# Actuals (#2632)
actuals:
  tokens: 13400
  tasks: 3
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Abhaengigkeitsfreies Node-Werkzeug im Formvorbild von tools/generate-eslint-globals.js: strikter Modus, nur fs/path, benannte Konstanten, alle Kernfunktionen einzeln exportiert, Direktaufruf-Zweig am Ende"
    - "Dreistufige Lebend-Erkennung (Wort-Token, eingefrorene Praefixe nur aus Klassen-Kontexten, Anker-Regel fuer Verbundselektoren) — Klassen-Kontext ist strikt auf class=/className=/classList.* begrenzt, niemals auf data-Attribute/IDs/Aktionsnamen"
    - "Quote-bewusster Zeichen-fuer-Zeichen-CSS-Blockscanner (Klammertiefe + Anfuehrungszeichen-Tracking) statt eines echten Parsers, im Stil von build.py's check_duplicate_functions()"
    - "scanClassContextValue(): interpolationsbewusster Scan, der ${...}-Bloecke als Ganzes ueberspringt (Klammertiefe), aber bei JEDER der drei Anfuehrungsarten stoppt — faengt sowohl Template-Literale mit verschachtelten Anfuehrungszeichen als auch per '+'-Konkatenation gebaute class=\"...\"-Attribute ab"
    - "Erwartungsgefuehrter Computed-Style-Diff: eine feste, im Spec benannte Ausnahmeliste erlaubter Abweichungen statt eines leeren Diffs als Gate"
    - "Navigation ueber window.switchView() statt UI-Klicks fuer einen vollstaendigen Sweep aller Ansichten — vermeidet ueberlappende Kopfzeilen-Dropdown-Menues, die sich bei schnellem Tab-zu-Tab-Klicken durch alle 24 Ansichten gegenseitig blockieren"

key-files:
  created:
    - tools/css-usage-report.js
    - tests/unit/css-usage-report.test.js
    - tests/e2e/features/computed-style-diff.spec.js
  modified:
    - package.json

key-decisions:
  - "Die drei kolportierten Zahlen (438 Klassen / 607 Regelbloecke / ~3.174 Zeilen) werden NICHT als Zielwert uebernommen (D-20) — die vom Werkzeug gemessenen Zahlen (738/757/5.762) sind ab jetzt verbindlich, auch wenn sie deutlich hoeher liegen"
  - "Waehrend der Pflicht-Fehlalarm-Pruefung (D-22) gefundener Klassifikationsfehler wird als Rule-1-Bugfix am Werkzeug selbst behoben, nicht als Ausnahmeliste-Eintrag verbucht: `class=\"foo' + (bar?'x':'') + '\"'`-Konkatenation (JS-Zeichenkette in ' wickelt eine HTML-Anfuehrung in \" ein) liess den alten `class=(quote)([\\s\\S]*?)quote`-Ausdruck bis zur naechsten \" weit hinter der echten Klassengrenze suchen. 14 Klassen betroffen, 5 davon (bestiary-fav, bestiary-list-item, init-mob-mode-btn, monster, fr-faction-card) waren VORHER faelschlich in der Totenliste — darunter ein dokumentiertes v1.0-Feature (Mob-Modus-Umschaltknopf) mit einer nicht durch Verbundselektor geschuetzten Einzelklassen-Regel, das ohne diesen Fund echtes lebendes CSS geloescht haette"
  - "Fuenf echte, nicht behebbare Werkzeuggrenzen (Read-Aloud-Farbvarianten crimson/violet/sage/sky/slate) werden als datierte DEAD_EXCEPTIONS-Eintraege gefuehrt statt die Erkennung zu erweitern — die Klassennamen existieren im Quelltext nur als `value: '<farbe>'` in einer Dropdown-Optionsliste, nie als Klassen-Kontext-Literal; eine Aufloesung braucht echte Daten-/Kontrollfluss-Verfolgung, die eine Text-Pruefung (Projektkonvention) bewusst nicht leistet"
  - "Der Computed-Style-Diff navigiert per `window.switchView()` statt per UI-Klick durch alle 24 Ansichten — ein roter Vorlauf zeigte, dass schnelles Klicken durch die Kopfzeilen-Dropdowns geoeffnete Menues ueberlappen laesst und nachfolgende Klicks blockiert; `switchView()` ist derselbe Codepfad wie ein echter Klick, nur ohne den Dropdown-Umweg"
  - "Die MAP-INTEGRATION-Abschnittsgrenze in dashboard.css wurde nachgemessen auf Z.543-1249 korrigiert (nicht bis Z.1978, wie eine erste, auf einen einzeiligen Header-Grep gestuetzte Annahme nahelegte) — ein vollstaendiger Abschnitts-Scan zeigte 10 weitere Abschnittsueberschriften zwischen 545 und 1978 (WIKI LINKS, CHARACTER ATTRIBUTES, MONSTER TEMPLATES, eine eigene, komplett verwaiste 'PWA INSTALL BANNER'-Sektion, DESIGN IMPROVEMENTS u.a.)"
  - "Das dashboard.css-Vorkommen `.pwa-banner`/`.pwa-banner.visible` (Z.1696-1746, eigene Abschnittsueberschrift 'PWA INSTALL BANNER') ist eine DRITTE, voellig eigenstaendige und lebendig-referenzfreie Klassenfamilie — weder das lebende `.pwa-update-banner` (pwa.css) noch das dead-aber-mit-Markup-verbundene `.pwa-install-banner` (dmscreen.css, der D-22-Sonderfall) betroffen. Faellt als gewoehnliche tote CSS im normalen dashboard.css-Restcommit, keine Sonderbehandlung noetig"

requirements-completed: [DEAD-01, DEAD-02, GATE-05]

coverage:
  - id: D1
    description: "tools/css-usage-report.js existiert, ist abhaengigkeitsfrei, dreistufig lebend-erkennend, deterministisch, mit Pruefmodus und maschinenlesbarer Ausgabe"
    requirement: "DEAD-01"
    verification:
      - kind: unit
        ref: "tests/unit/css-usage-report.test.js (23/23 passed)"
        status: pass
      - kind: other
        ref: "node tools/css-usage-report.js / --json / --check gegen den echten Baum, siehe Ratschen-Beweis unten"
        status: pass
    human_judgment: false
  - id: D2
    description: "Zwei Laeufe liefern byte-gleiche Ausgabe (Determinismus), Sortierung Dateiname/Klassenname aufsteigend"
    requirement: "DEAD-01"
    verification:
      - kind: other
        ref: "cmp zweier --json-Laeufe, siehe Ratschen-Beweis"
        status: pass
    human_judgment: false
  - id: D3
    description: "Fehlalarm-Pruefung von mindestens 20 gemeldeten Klassen durchgefuehrt und protokolliert, inkl. Fund und Behebung eines echten Klassifikationsfehlers"
    requirement: "DEAD-02"
    verification:
      - kind: manual_procedural
        ref: "Hand-Pruefungs-Tabelle im SUMMARY, 31 Klassen"
        status: pass
    human_judgment: true
    rationale: "Die Pflicht-Fehlalarm-Pruefung ist per Definition eine von Hand nachvollzogene Suche (Kommando + Suchbereich je Klasse) — die Tabelle im SUMMARY ist das Protokoll, ihre inhaltliche Richtigkeit ist die menschliche Abnahme, die dieses Kriterium selbst verlangt (D-22-Pflicht)."
  - id: D4
    description: "Computed-Style-Vergleichslauf in drei Durchgaengen (Standard/schmales Layout/reduzierte Bewegung), erwartungsgefuehrt, stabil ueber zwei Laeufe"
    requirement: "GATE-05"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/computed-style-diff.spec.js (3/3 passed, zweifach hintereinander gelaufen)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Die verbindliche Loeschliste (738/757/5.762) und die Loeschreihenfolge fuer Plan 15-07 liegen vor, keine der drei kolportierten Zahlen als Zielwert"
    requirement: "DEAD-01"
    verification:
      - kind: other
        ref: "node tools/css-usage-report.js gegen HEAD dieses Plans, siehe Tabelle im SUMMARY"
        status: pass
    human_judgment: false

# Metrics
duration: ~110min
completed: 2026-09-09
status: complete
---

# Phase 15 Plan 06: css-usage-report — Werkzeug, Loeschzahlen und Nachweis-Harness Summary

**Ein abhaengigkeitsfreies Node-Werkzeug mit dreistufiger Lebend-Erkennung (Wort-Token, eingefrorene Praefixe, Anker-Regel fuer Verbundselektoren) liefert die verbindliche Loeschzahl fuer Phase 15 — 738 tote Klassen statt der drei nicht reproduzierbaren kolportierten Zahlen — samt einem waehrend der Pflicht-Fehlalarm-Pruefung selbst gefundenen und behobenen Klassifikationsfehler (String-Konkatenations-Klassenattribute), fuenf dokumentierten Werkzeuggrenzen und einem dreistufigen Computed-Style-Vergleichslauf als zweite Absicherung vor dem ersten Loeschcommit.**

## Performance

- **Duration:** ~110 min
- **Completed:** 2026-09-09
- **Tasks:** 3
- **Files created:** 3 (`tools/css-usage-report.js`, `tests/unit/css-usage-report.test.js`, `tests/e2e/features/computed-style-diff.spec.js`)
- **Files modified:** 1 (`package.json`)

## Accomplishments

- `tools/css-usage-report.js`: dreistufige Lebend-Erkennung exakt nach D-21 (Wort-Token-Gleichheit, fuenf eingefrorene Praefixe `color-`/`condition-`/`editor-toolbar-`/`rel-btn-`/`tag-` ausschliesslich aus Klassen-Kontexten, Anker-Regel fuer Verbundselektoren), quote-bewusster Zeichen-fuer-Zeichen-CSS-Blockscanner (Klammertiefe + Anfuehrungszeichen), `@keyframes`-Namen werden nie als Klassenselektoren mitgezaehlt, `--json`- und `--check`-Modus, `COMMENT_RE` woertlich identisch mit `design-consistency.test.js`s `withoutComments()`
- `tests/unit/css-usage-report.test.js`: 23 Testfaelle gegen kleine, selbst definierte Zeichenketten-Vorlagen (nie gegen den echten Baum) — RED vor dem Werkzeugbau protokolliert, GREEN danach
- Waehrend der Task-3-Pflicht-Fehlalarm-Pruefung gefunden und **im selben Plan als Rule-1-Bugfix behoben**: `class="foo' + (bar?'x':'') + '"'`-Konkatenationsmuster (haeufig in `bestiary-render.js`, `initiative-mob.js`, `fraktionen-render.js`, `dice-stats-render.js`) liess den alten quote-matched Scan bis weit hinter die echte Klassengrenze laufen. Neue `scanClassContextValue()` behebt das interpolationsbewusst (`${...}` wird als Ganzes uebersprungen) UND konkatenationssicher (stoppt bei jeder der drei Anfuehrungsarten). 14 betroffene Klassen bestaetigt live, 5 davon waren vorher faelschlich tot — darunter `.init-mob-mode-btn` (dokumentiertes v1.0-Mob-Modus-Feature, Einzelklassen-Regel ohne Verbundselektor-Schutz)
- Fuenf echte, nicht mit vertretbarem Aufwand behebbare Werkzeuggrenzen (`crimson`/`violet`/`sage`/`sky`/`slate`, die Read-Aloud-Farbvarianten aus `ui/editors/rich-text.js:412`) als datierte `DEAD_EXCEPTIONS`-Eintraege dokumentiert
- `tests/e2e/features/computed-style-diff.spec.js`: drei serialisierte Durchgaenge (Standard, schmales Layout via `window.setLayout('mobile')`, emulierte `prefers-reduced-motion`) ueber alle 24 registrierten Ansichten, feste 12-Eigenschaften-Liste ohne `width`/`height`, Deckelung bei 300 Elementen/Ansicht mit Ausweis im Bericht, sechs benannte erwartete Abweichungen (D-24)
- Erster Abzug erhoben und unter `tests/e2e/test-results/computed-style-snapshot.json` abgelegt (nicht versioniert) — der Vergleichsstand fuer Plan 15-07
- Verbindliche Loeschzahl gemessen: **738 tote Klassen** (733 ausserhalb der Ausnahmeliste), **757 vollstaendig tote Regelbloecke**, **5.762 Zeilen** — ersetzt die drei kolportierten Zahlen (438/607/~3.174) vollstaendig
- PWA-Install-Banner-Sonderfall vollstaendig kartiert (CSS + Markup + Whitelist-Eintraege, siehe unten) samt Vorhersage fuer die Inline-Stil-Ratsche (257 → 256)
- Vollstaendige, gemessene Loeschreihenfolge fuer Plan 15-07 festgelegt (18 Commits, deckungsgleich mit D-23s Schaetzung)

## Task Commits

Each task was committed atomically:

1. **Task 1: tools/css-usage-report.js mit dreistufiger Lebend-Erkennung und Pruefmodus** — `ac743cf` (feat)
2. **Task 2: Vergleichslauf berechneter Stile in drei Durchgaengen** — `256af61` (test)
3. **Task 3: Erste Loeschliste erheben und von Hand gegenpruefen** — `d8faea6` (fix, Rule-1-Bugfix am Werkzeug, gefunden waehrend der Pflicht-Fehlalarm-Pruefung) + `85f4726` (docs, DEAD_EXCEPTIONS-Eintraege)

**Plan metadata:** wird nach diesem SUMMARY committet (STATE.md/ROADMAP.md/REQUIREMENTS.md)

_Hinweis: Task 3 selbst fuegt keinen neuen Produktionscode hinzu (Mess-/Dokumentations-Task) — die zwei Task-3-Commits sind ausschliesslich der waehrend der Hand-Pruefung gefundene Werkzeugfehler und dessen Dokumentation, beide direkt aus der Pflicht-Fehlalarm-Pruefung entstanden, keine eigenstaendigen Nebenaufgaben._

## Files Created/Modified

- `tools/css-usage-report.js` — Neu: dreistufiges Lebend-Erkennungswerkzeug, siehe Accomplishments
- `tests/unit/css-usage-report.test.js` — Neu: 23 Testfaelle, RED-vor-Werkzeugbau protokolliert
- `tests/e2e/features/computed-style-diff.spec.js` — Neu: dreistufiger Computed-Style-Vergleichslauf
- `package.json` — `css-usage:report` und `css-usage:check` Skripte ergaenzt

## Decisions Made

Siehe `key-decisions` im Frontmatter. Kernpunkte: die drei kolportierten Loeschzahlen werden nicht uebernommen (D-20); ein waehrend der Pflicht-Fehlalarm-Pruefung gefundener echter Klassifikationsfehler wird als Bugfix am Werkzeug selbst behoben, nicht als Ausnahmeliste-Eintrag kaschiert; fuenf echte, mit einer Text-Pruefung nicht schliessbare Erkennungsluecken werden stattdessen als datierte Ausnahmen gefuehrt; die MAP-INTEGRATION-Abschnittsgrenze wurde nach einem vollstaendigen Abschnitts-Scan korrigiert.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] css-usage-report.js erkannte per String-Konkatenation gebaute class="..."-Attribute nicht**
- **Found during:** Task 3 (Pflicht-Fehlalarm-Pruefung, D-22)
- **Issue:** `CLASS_ATTR_RE`/`CLASS_NAME_ASSIGN_RE` verlangten, dass die Klassen-Kontext-Zeichenkette mit DERSELBEN Anfuehrung endet, mit der sie begann. In diesem Quellbaum weit verbreitet ist aber ein Muster wie `'<button class="foo' + (bar ? ' baz' : '') + '"' + '>...'` — eine einfach zitierte JS-Zeichenkette, die eine doppelt zitierte HTML-Anfuehrung umschliesst und per `+` fortsetzt. Der alte Scan lief bis zur naechsten `"`, weit hinter der echten Klassengrenze, und sammelte JS-Syntax statt des Klassennamens ein. Betroffen: `features/bestiary/bestiary-render.js`, `features/dice-stats/dice-stats-render.js`, `features/fraktionen/fraktionen-render.js`, `features/initiative-combat-widgets.js`, `features/initiative-mob.js` (mindestens 14 Klassennamen, davon 5 vorher faelschlich als tot gemeldet: `bestiary-fav`, `bestiary-list-item`, `init-mob-mode-btn`, `monster`, `fr-faction-card`). `.init-mob-mode-btn` ist besonders schwerwiegend: eine dokumentierte v1.0-Funktion (Mob-Modus-Umschaltknopf, `initiative-mob.js:178/183`) mit einer Einzelklassen-CSS-Regel OHNE Verbundselektor-Schutz — waere ohne diesen Fund ein echter Loeschkandidat fuer Plan 15-07 gewesen.
- **Fix:** Neue `scanClassContextValue()`-Funktion scannt zeichenweise ab der oeffnenden Anfuehrung, ueberspringt `${...}`-Interpolationen als Ganzes (Klammertiefe mitgefuehrt, damit Anfuehrungszeichen INNERHALB einer Interpolation den Scan nicht abbrechen), und stoppt bei der ERSTEN Anfuehrung EGAL welcher der drei Arten ausserhalb einer Interpolation. Das faengt sowohl den Regelfall (Template-Literal mit verschachtelten Anfuehrungszeichen) als auch den Konkatenationsfall korrekt ab.
- **Files modified:** `tools/css-usage-report.js`, `tests/unit/css-usage-report.test.js` (zwei neue Regressionstests)
- **Verification:** `npx jest tests/unit/css-usage-report.test.js` 23/23 gruen; alle 14 betroffenen Klassen manuell gegen den echten Baum bestaetigt live (siehe Hand-Pruefungs-Tabelle); globale Totenzahl 743 → 738; `npx jest` gesamt weiterhin 1243/1243, `npm run lint` auf den beiden Dateien 0 Probleme
- **Committed in:** `d8faea6`

**2. [Rule 2 — Fehlende kritische Funktionalitaet] Fuenf echte Werkzeuggrenzen als DEAD_EXCEPTIONS dokumentiert**
- **Found during:** Task 3 (Pflicht-Fehlalarm-Pruefung, D-22)
- **Issue:** `crimson`/`violet`/`sage`/`sky`/`slate` (die fuenf Read-Aloud-Farbvarianten, CLAUDE.md § "Read-Aloud Text Styles") sind echte, lebendige CSS-Klassen (`.read-aloud.crimson` usw. in `party.css:402-434`), aber `setReadAloudFormat()` (`ui/editors/rich-text.js:412`) baut den Klassennamen ueber eine Ternary auf einer Laufzeit-Variable (`style`), deren moegliche Werte nur als `value: '<farbe>'` in einer Dropdown-Optionsliste (`ui/editors/editor-toolbar-build.js:47ff`) stehen — nie als eigenstaendiges Zeichenketten-Literal in einem Klassen-Kontext. Ohne diese Dokumentation waeren diese fuenf Klassen in der `--check`-Fehlerliste ununterscheidbar von echtem toten Bestand.
- **Fix:** Fuenf datierte Eintraege in `DEAD_EXCEPTIONS` mit Begruendung (Datum 2026-09-09) statt einer riskanten Erkennungserweiterung (echte Daten-/Kontrollfluss-Verfolgung ist mit einer Text-Pruefung ohne echten Parser — Projektkonvention — nicht vertretbar zu schliessen).
- **Files modified:** `tools/css-usage-report.js`, `tests/unit/css-usage-report.test.js` (Testfall auf Eintrags-FORM statt Leer-Zwang umgestellt)
- **Verification:** `node tools/css-usage-report.js --check` meldet 733 statt 738 Fehler (5 korrekt ausgenommen); `npx jest tests/unit/css-usage-report.test.js` 23/23 gruen
- **Committed in:** `85f4726`

---

**Total deviations:** 2 auto-fixed (1 Rule-1-Bugfix am eigenen Werkzeug, 1 Rule-2-Dokumentation echter Werkzeuggrenzen).
**Impact on plan:** Beide Funde entstanden AUS der planvorgeschriebenen Pflicht-Fehlalarm-Pruefung selbst (D-22) — sie sind das erwartete Ergebnis dieser Pruefung, nicht Scope Creep. Ohne den ersten Fund haette Plan 15-07 ein dokumentiertes v1.0-Feature geloescht.

## Issues Encountered

Eine erste, auf einen einzeiligen Header-Grep gestuetzte Annahme ueber die MAP-INTEGRATION-Abschnittsgrenze in `dashboard.css` (Z.543-1978) erwies sich beim Nachmessen als falsch — ein vollstaendiger Abschnitts-Scan (`grep` nach allen GROSSSCHRIFT-Kopfzeilen, nicht nur `^/\* ==`, das eingerueckte Kopfzeilen uebersah) zeigte 10 weitere Abschnitte zwischen Z.545 und Z.1978, darunter eine eigene, komplett verwaiste "PWA INSTALL BANNER"-Sektion (Z.1694-1746, `.pwa-banner`/`.pwa-banner.visible` — eine DRITTE, von den beiden anderen PWA-Banner-Familien unabhaengige tote Klasse). Korrigiert vor der Uebernahme in die Loeschreihenfolge (siehe unten): MAP INTEGRATION ist Z.543-1249, 724 tote Zeilen in 102 Regelbloecken.

## User Setup Required

None - keine externe Service-Konfiguration noetig.

## Ratschen-Beweis (D-49) — Task 1

**RED vor dem Werkzeugbau:**

```
npx jest tests/unit/css-usage-report.test.js
Cannot find module '../../tools/css-usage-report.js'
Exit-Code ungleich 0 (Suite failed to run)
```

**GREEN nach dem Werkzeugbau, alle Acceptance-Criteria-Kommandos:**

```
npx jest tests/unit/css-usage-report.test.js        -> 21/21 passed (Task 1), spaeter 23/23 (nach Task 3s Regressionstests)
node tools/css-usage-report.js                       -> Exit-Code 0, Tabelle mit 20 Dateizeilen (inkl. 5x null-Zeile)
node tools/css-usage-report.js --json | node -e ...   -> Exit-Code 0 (gueltiges JSON, files+totals vorhanden)
node tools/css-usage-report.js --json > a.json
node tools/css-usage-report.js --json > b.json
cmp a.json b.json                                     -> Exit-Code 0 (byte-gleich)
grep -c "require(" tools/css-usage-report.js          -> 2 (nur fs, path)
npm run lint                                           -> die zwei neuen Dateien: 0 Probleme (vorbestehende Repo-weite 5 Fehler/372 Warnungen sind unveraendert und ausserhalb dieses Plans, siehe unten)
```

**`npm run lint`-Praezisierung:** Der Gesamtlauf (`eslint . --max-warnings 367`) endet mit Exit-Code 1 wegen 5 vorbestehender `no-undef`-Fehler (`customElements`, `URLSearchParams`) in `Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/support.js` — verifiziert unveraendert seit Commit `05515de` (2026-09-08, vor dieser Phase, `git status --short` zeigt die Datei sauber) und ausserhalb des App-Quellbaums (ein Design-Handoff-Artefakt). Ausserhalb dieses Plans, siehe `PROJECT.md` § Übertrag. Gezielt auf die zwei neuen Dateien (`npx eslint tools/css-usage-report.js tests/unit/css-usage-report.test.js`): Exit-Code 0, 0 Probleme — das plan-eigene Akzeptanzkriterium ("das neue Werkzeug hat die Warnungsgrenze ueberschritten oder einen Lint-Fehler eingefuehrt") ist damit erfuellt.

## Ratschen-Beweis (D-49) — Task 2

```
PYTHONIOENCODING=utf-8 python build.py && npx playwright test tests/e2e/features/computed-style-diff.spec.js --reporter=list
3 passed (Standard, Schmales Layout, Emulierte reduzierte Bewegung), Exit-Code 0

npx playwright test tests/e2e/features/computed-style-diff.spec.js --reporter=list   (zweiter, unveraenderter Lauf)
3 passed, 0 unerwartete Abweichungen, Exit-Code 0
```

Erste Fassung navigierte per UI-Klick durch alle 24 Ansichten (wie `tests/e2e/helpers/test-utils.js`s `navigateToTab()`) und schlug beim Uebergang von `initiative` zu `loot` mit einem 30s-Timeout fehl: das geoeffnete `.nav-group-menu`-Dropdown der vorherigen Gruppe blockierte den Klick auf die naechste, gemeldet als "`.encounter-controls` (sticky) intercepts pointer events" — irrefuehrend, denn die eigentliche Ursache war der Navigationsweg, nicht das sticky-Element. Behoben durch Umstellung auf `window.switchView()` (derselbe Codepfad, den `tests/e2e/tab-navigation.spec.js` fuer denselben Zweck bereits nutzt), danach beide Laeufe sauber gruen.

Abzugsdatei: `tests/e2e/test-results/computed-style-snapshot.json` (nicht versioniert, `outputDir`-Konvention aus `playwright.config.js`), 24 Ansichten je Durchgang, minimale Elementzahl je Ansicht 15 (Deckelung 300, nie erreicht).

**Erhebungszeitpunkt des ersten Abzugs:** 2026-09-09, unmittelbar nach diesem Plan (15-06) — NACH den drei Fix-Commits (15-01 Bewegungsunterdrueckung, 15-04 DM-Screen-Widgets, 15-05 Zauberplatz-Pips/Wuerfelfarbe) und VOR dem ersten Loeschcommit von Plan 15-07, exakt wie von D-24 verlangt.

## Ratschen-Beweis (D-49) — Task 3, Hand-Pruefung (D-22, Pflicht)

**31 gemeldete Klassen von Hand gegengeprueft**, ueber 15 Dateien gestreut, ausdruecklich einschliesslich Klassen, die auf einen der fuenf eingefrorenen Praefixe passen koennten (Zeilen 22-23 unten). Jede Zeile nennt Kommando und Suchbereich.

| # | Klasse | Datei | Kommando (Suchbereich: `features/ systems/ ui/ core/ render/ utils/ assets/templates/`) | Ergebnis |
|---|--------|-------|-----------|----------|
| 1 | `dice-btn` | dashboard.css | `grep -rn "class=.*\bdice-btn\b\|classList.*dice-btn"` | tot bestaetigt — nur `.dms-dice-btn` (anderer Wortlaut) trifft |
| 2 | `dice-crit` | dashboard.css | `grep -rn "\bdice-crit\b"` ueber Suchbereich | tot bestaetigt — 0 Treffer |
| 3 | `dice-attr-btn` | dashboard.css | wie oben | tot bestaetigt — 0 Treffer |
| 4 | `damage-type-chip` | dashboard.css | wie oben | tot bestaetigt — 0 Treffer |
| 5 | `dice-history-header` | dashboard.css | wie oben | tot bestaetigt — 0 Treffer |
| 6 | `map-tab` | dashboard.css | wie oben | tot bestaetigt — 0 Treffer (MAP-INTEGRATION-Restbestand) |
| 7 | `dashboard-card` | core.css | wie oben | tot bestaetigt — 0 Treffer |
| 8 | `npc-tag-avatar` | npcs.css | wie oben | tot bestaetigt — nur `.npc-tag-avatar` selbst in CSS, kein Markup-Treffer |
| 9 | `char-condition-badge` | tools.css | wie oben | tot bestaetigt — nur `.condition-badge` (anderer, lebender Wortlaut) trifft als Substring |
| 10 | `row-avatar` | encounters.css | wie oben | tot bestaetigt — 0 Treffer |
| 11 | `loot-attunement-badge` | loot.css | wie oben | tot bestaetigt — 0 Treffer |
| 12 | `spell-editor-toolbar` | spells.css | wie oben | tot bestaetigt — 0 Treffer (Werkzeugleisten kommen aus `buildEditorToolbar()`, nicht dieser Klasse) |
| 13 | `btn-special` | editors.css | wie oben | tot bestaetigt — 0 Treffer |
| 14 | `nav-tab-icon` | variables.css | wie oben | tot bestaetigt — 0 Treffer (Nav nutzt `.nav-tab`, keine `-icon`/`-text`-Unterklassen) |
| 15 | `hp-calculator` | core.css | `grep -rn "hp-calculator\b"` (ohne `.css`) | tot bestaetigt — nur `data-action="show-hp-calculator"` (Aktionsname, kein Klassen-Kontext) und `showHpCalculator()` (Funktionsname); das echte Modal wird per ID (`$('hp-calc-modal')`) angesteuert |
| 16 | `hp-calc-input` | core.css | wie oben | tot bestaetigt — dieselbe ID-statt-Klassen-Ansteuerung |
| 17 | `quick-actions-bar` (Klassenform) | dmscreen.css | `grep -rn "quick-actions-bar"` gesamter Baum | tot bestaetigt — die LEBENDE Instanz ist eine ID (`id="quick-actions-bar"` in `view-encounters.html:371`, `$('quick-actions-bar')` in `quick-actions.js:58`), gestylt in `party.css` per `#quick-actions-bar`; `dmscreen.css`s `.quick-actions-bar`-KLASSE ist eine eigenstaendige, nie referenzierte Regel |
| 18 | `dms-terrain-tag` | dmscreen.css | wie oben | tot bestaetigt — Altbestand der vor Plan 15-04 falsch benannten Terrain-Widget-Familie |
| 19 | `pwa-banner` | dashboard.css | `grep -rn "class=\"pwa-banner\|'pwa-banner'\|classList.*pwa-banner"` | tot bestaetigt — 0 Treffer; eigenstaendige, komplett verwaiste dritte PWA-Banner-Klasse (siehe Sonderfall-Abschnitt unten) |
| 20 | `fr-ruf-btn` | welt.css | `grep -n "fr-ruf-btn" features/fraktionen/fraktionen-render.js` | tot bestaetigt — nur `fr-ruf-btn-minus`/`fr-ruf-btn-plus` (andere, vollstaendige Wort-Token) kommen vor; `fr-ruf-btn` allein nirgends |
| 21 | `condition-badge` (Substring-Gegenprobe) | dmscreen.css | `grep -n "condition-badge" systems/undo.js` | LEBENDIG bestaetigt (`class="condition-badge ${key} active"`, `undo.js:338`) — bewusst als Gegenprobe zur eigenen Verifikationsmethodik gewaehlt: eine fruehere, zu grobe `\b`-Grep-Pruefung haette `char-condition-badge` (Zeile 9) faelschlich als denselben Fund gelesen, weil `\b` an einem Bindestrich triggert |
| 22 | `condition-blinded` (Praefix-Stichprobe) | core.css | `node`-Einzeiler: `collectLiveTokens(...).has('condition-blinded')` | Praefix-Rettung bestaetigt funktionsfaehig: Wort-Token-Treffer `false`, aber ueber Stufe 2 (`condition-` besetzt durch `systems/conditions.js:112`s `` `condition-${c.type}` ``) lebendig — GENAU der Fall, den D-21 fuer die Praefixliste vorsieht |
| 23 | `tag-blue` (Praefix-Stichprobe) | core.css | wie #22, mit `tag-blue` | Praefix-Rettung bestaetigt: Wort-Token-Treffer `false`, ueber `tag-${t.color}` (`systems/tags.js:33` u.a.) lebendig |
| 24 | `crimson` | party.css | `grep -n "crimson" ui/editors/rich-text.js ui/editors/editor-toolbar-build.js` | **FEHLALARM** — lebendig ueber `setReadAloudFormat()`-Ternary + Dropdown-Optionswert (siehe Deviation 2, DEAD_EXCEPTIONS) |
| 25 | `violet` | party.css | wie #24 | **FEHLALARM** — wie crimson |
| 26 | `sage` | party.css | wie #24 | **FEHLALARM** — wie crimson |
| 27 | `sky` | party.css | wie #24 | **FEHLALARM** — wie crimson |
| 28 | `slate` | party.css | wie #24 | **FEHLALARM** — wie crimson |
| 29 | `init-mob-mode-btn` | initiative.css | `grep -n "init-mob-mode-btn" features/initiative-mob.js` | **FEHLALARM, behoben** — String-Konkatenation (siehe Deviation 1); jetzt lebendig erkannt |
| 30 | `bestiary-fav` | bestiary.css | `grep -n "bestiary-fav" features/bestiary/bestiary-render.js` | **FEHLALARM, behoben** — dieselbe Ursache |
| 31 | `monster` | initiative.css | `grep -n "class=.*monster" features/initiative-mob.js` | **FEHLALARM, behoben** — dieselbe Ursache (`init-entry init-row monster`) |

**Ergebnis:** 20 echte tote Klassen bestaetigt (Zeilen 1-20), 2 Substring-/Praefix-Gegenproben zur eigenen Methodik (21-23, beide bestehen), **8 echte Fehlalarme gefunden** (24-31) — 5 als dokumentierte Werkzeuggrenze (DEAD_EXCEPTIONS), 3 als Werkzeugfehler behoben (der Fix behebt tatsaechlich 14 Klassen insgesamt, siehe Deviation 1; hier sind nur die drei tatsaechlich hand-geprueften aufgefuehrt). **Kein einziger Fehlalarm wurde uebergangen** — das Ergebnis steht auch dann im SUMMARY, wenn es (wie hier) NICHT null Fehlalarme sind.

## PWA-Install-Banner-Sonderfall (D-22)

Kein reiner CSS-Fall — drei voneinander unabhaengige PWA-Banner-Klassenfamilien existieren im Baum, bestaetigt per `grep -rn "pwa-banner\|pwa-install" assets/styles/*.css`:

| Familie | Ort | Status | Aktion |
|---------|-----|--------|--------|
| `.pwa-install-btn` | `pwa.css:11-42` | LEBENDIG — Kopfzeilen-Installations-Knopf (`header.html:11`, `data-action="install-pwa"`, registriert in `systems/spellslots/pwa-install.js:120-124`) | Bleibt unangetastet — die einzige lebende Installationsroute |
| `.pwa-update-banner` | `pwa.css:48-127`, `@keyframes pwa-banner-slide-up` | LEBENDIG — Laufzeit-erzeugtes SW-Update-Banner (`pwa-install.js:56-111`) | Bleibt unangetastet |
| `.pwa-install-banner` + `.pwa-install-icon/-text/-title/-desc/-actions` | `dmscreen.css:1017-1064` (7 Selektoren, 48 Zeilen) | **TOT, aber mit Markup verbunden** — Markup existiert in `assets/templates/modals-editors.html:597-607` (11 Zeilen), zeigt es aber NIE an (0 JS-Treffer fuer `pwa-install-banner` in `.js`-Dateien ausser Playwright-Testartefakten) | **Sonderfall-Loeschung** (siehe unten) |
| `.pwa-banner` + `.pwa-banner.visible` | `dashboard.css:1696-1746` (eigene Abschnittsueberschrift "PWA INSTALL BANNER", Z.1694), 20 Zeilen | TOT, KEIN Markup — voellig eigenstaendig, 0 Treffer irgendwo | Gewoehnliche tote CSS, faellt im normalen dashboard.css-Restcommit |

**Warum das Werkzeug `.pwa-install-banner` nicht selbst als tot meldet:** Die Klasse steht LITERAL im Markup (`class="pwa-install-banner" id="pwa-install-banner"`, `modals-editors.html:597`) — das ist per Definition ein Klassen-Kontext-Treffer (Stufe 1), also lebendig im Sinne des Werkzeugs. Das Werkzeug beantwortet "kommt diese Klasse in einem Klassen-Kontext vor?", nicht "wird dieses Element jemals angezeigt?" — letzteres ist Erreichbarkeitsanalyse, kategorisch ausserhalb einer Text-Pruefung. Genau deshalb sieht D-22/dieser Plan diesen Fall als HANDGEFUEHRTE Sonderpruefung vor, nicht als Werkzeug-Output.

**Vollstaendige Loeschmenge fuer den PWA-Sonderfall (ein gemeinsamer Commit, Plan 15-07):**
- CSS: `dmscreen.css:1017-1064` — alle 7 Selektoren (`.pwa-install-banner`, `.pwa-install-banner.show`, `.pwa-install-icon`, `.pwa-install-text`, `.pwa-install-title`, `.pwa-install-desc`, `.pwa-install-actions`), 48 Zeilen inkl. Kopfkommentar
- Markup: `assets/templates/modals-editors.html:597-607`, 11 Zeilen (`<div class="pwa-install-banner" ...>` samt beiden Knoepfen)
- `core/constants.js` `CALL_ACTION_WHITELIST`: die Eintraege `installPWA` (Z.627) UND `dismissPWABanner` (Z.606) werden BEIDE verwaist — `dismissPWABanner` ist ohnehin nirgends als Funktion definiert (bestaetigt: `grep -rn "function dismissPWABanner"` → 0 Treffer), `installPWA` bleibt als **Funktion** bestehen (der Kopfzeilen-Knopf braucht sie ueber die dedizierte `install-pwa`-Aktion weiter, NICHT ueber die `call`+Whitelist-Route), nur ihr Whitelist-Eintrag fuer den generischen `data-action="call"`-Pfad wird verwaist, weil `data-value="installPWA"` nach der Markuploeschung nirgends mehr vorkommt
- **Feststellung fuer Plan 15-07:** `installPWA()` selbst NICHT loeschen — nur den `CALL_ACTION_WHITELIST`-Eintrag
- **UAT-Punkt fuer Plan 15-07:** PWA-Installation ueber den Kopfzeilen-Knopf (`#pwa-install-btn`) auf einer echten HTTPS/localhost-Origin ausloesen und bestaetigen, dass sie weiterhin funktioniert — die einzige lebende Route ist davon unberuehrt, aber muss nach der Loeschung bestaetigt werden

## Inline-Stil-Ratsche — Ausgangswert und Vorhersage

```
node -e "const fs=require('fs'),p='assets/templates';let n=0;for(const f of fs.readdirSync(p).filter(f=>f.endsWith('.html')))n+=(fs.readFileSync(p+'/'+f,'utf8').match(/style=\"/g)||[]).length;console.log(n)"
257
```

Ausgangswert **257** bestaetigt (unveraendert seit Phase-15-Start, D-51). Die geloeschte PWA-Banner-Markup-Zeile (`style="display:none;"`) traegt genau EIN `style="`-Vorkommen — die Vorhersage fuer Plan 15-07 ist damit **256** nach der Markuploeschung, exakt wie in D-51 vorgesehen ("`INLINE_MAX` sinkt 257 → 256 in Phase 15").

## Verbindliche Loeschzahl je Datei (Plan 15-07, D-20)

```
node tools/css-usage-report.js
```

| Datei | tote Klassen | tote Regelbloecke | Zeilen darin |
|---|---|---|---|
| bestiary.css | 4 | 2 | 21 |
| command-palette.css | 0 | 0 | 0 |
| core.css | 71 | 53 | 381 |
| dashboard.css | 209 | 226 | 1589 |
| dice.css | 10 | 9 | 70 |
| dmscreen.css | 155 | 137 | 1129 |
| editors.css | 8 | 1 | 6 |
| encounters.css | 85 | 97 | 727 |
| file-backup.css | 0 | 0 | 0 |
| fonts.css | 0 | 0 | 0 |
| initiative.css | 14 | 6 | 48 |
| loot.css | 37 | 25 | 206 |
| migration.css | 0 | 0 | 0 |
| npcs.css | 71 | 85 | 710 |
| party.css | 42 | 26 | 196 |
| pwa.css | 0 | 0 | 0 |
| spells.css | 9 | 2 | 27 |
| tools.css | 77 | 76 | 570 |
| variables.css | 6 | 3 | 18 |
| welt.css | 8 | 9 | 64 |
| **Summe (je Datei)** | **806** | **757** | **5.762** |
| **Global eindeutig** | **738** | — | — |

(Die Differenz 806 vs. 738 ist keine Unstimmigkeit: eine Klasse wie `location-card` ist in mehreren Dateien gleichzeitig tot und zaehlt je Datei einmal, global aber nur einmal als eindeutiger Name.)

**Vier DEAD-03-Basisgroessen** (je einmal gesamt, einmal davon in toten Regeln):

| Groesse | Gesamt | Davon in toten Regeln |
|---|---|---|
| rgba/rgb-Zahlentripel | 389 | 49 |
| `em` (relative Schriftgroessen) | 817 | 173 |
| `box-shadow`-Deklarationen | 88 | 13 |
| `transition: all` | 163 | 30 |

**Keine der drei kolportierten Zahlen (438 Klassen / 607 Regelbloecke / ~3.174 Zeilen) erscheint hier als Zielwert** — die gemessenen Zahlen (738/757/5.762) sind ab jetzt verbindlich, deutlich hoeher als kolportiert, weil das Werkzeug u.a. eine bisher unbenannte, komplett tote Legacy-Wuerfelroller-Sektion in `dashboard.css` (Z.1-339, "DICE ROLLER"-Abschnittsueberschrift) fand, die keines der drei fruehe­ren Dokumente erwaehnt.

## Loeschreihenfolge fuer Plan 15-07 (D-23, 18 Commits)

Eine Datei je Commit, MAP-Block zuerst, absteigend nach Loeschmenge, PWA-Paar vorletzt, Testdatei zuletzt:

| # | Commit-Inhalt | Zeilen | Regelbloecke |
|---|---|---|---|
| 1 | **dashboard.css — nur Abschnitt "MAP INTEGRATION" (Z.543-1249)** | 724 | 102 |
| 2 | dmscreen.css (gesamt) | 1.129 | 137 |
| 3 | dashboard.css (Rest, ausserhalb MAP INTEGRATION) | 865 | 124 |
| 4 | encounters.css | 727 | 97 |
| 5 | npcs.css | 710 | 85 |
| 6 | tools.css | 570 | 76 |
| 7 | core.css | 381 | 53 |
| 8 | loot.css | 206 | 25 |
| 9 | party.css | 196 | 26 |
| 10 | dice.css | 70 | 9 |
| 11 | welt.css | 64 | 9 |
| 12 | initiative.css | 48 | 6 |
| 13 | spells.css | 27 | 2 |
| 14 | bestiary.css | 21 | 2 |
| 15 | variables.css | 18 | 3 |
| 16 | editors.css | 6 | 1 |
| 17 | **PWA-Paar**: dmscreen.css `.pwa-install-banner`-Familie (Z.1017-1064, 48 Zeilen, NICHT vom Werkzeug automatisch erkannt) + `modals-editors.html:597-607` (11 Zeilen Markup) + `core/constants.js` `CALL_ACTION_WHITELIST` (`installPWA`, `dismissPWABanner`, 2 Eintraege) | ~61 | — |
| 18 | Sammeländerung `tests/unit/design-consistency.test.js` (`INLINE_MAX` 257→256, ggf. weitere Ratschen-Nachfuehrung nach den 16 CSS-Commits) | — | — |

Dateien mit 0 toten Klassen (kein eigener Commit noetig): `command-palette.css`, `file-backup.css`, `fonts.css`, `migration.css`, `pwa.css`.

**18 Commits** — deckungsgleich mit D-23s Schaetzung ("Rund 18 Commits").

## Next Phase Readiness

- `tools/css-usage-report.js` steht bereit fuer Plan 15-07: `node tools/css-usage-report.js --json` liefert die maschinenlesbare Grundlage, `--check` gated den erwarteten Endzustand (0 Fehler ausserhalb der 5 dokumentierten Ausnahmen)
- `tests/e2e/features/computed-style-diff.spec.js` und sein erster Abzug (`tests/e2e/test-results/computed-style-snapshot.json`) stehen bereit als dritte Nachweissaeule fuer jeden Loeschcommit
- Die vollstaendige, gemessene Loeschreihenfolge (18 Commits) und der PWA-Sonderfall sind dokumentiert — Plan 15-07 muss sie nicht neu erheben
- Volle Suiten gruen: Jest 1243/1243 (54 Suiten, davon 23 neu in `css-usage-report.test.js`), Playwright 366 gesamt (364 passed / 2 skipped, davon 3 neu in `computed-style-diff.spec.js`), `design-consistency.test.js` unveraendert 67/67, `pytest tests/build` 24/24, beide Builds erfolgreich

## Self-Check: PASSED

- FOUND: tools/css-usage-report.js (LIVE_PREFIXES, DEAD_EXCEPTIONS, analyze, renderTable, collectCssClasses, collectLiveTokens, COMMENT_RE, withoutComments alle vorhanden)
- FOUND: tests/unit/css-usage-report.test.js (23 Testfaelle)
- FOUND: tests/e2e/features/computed-style-diff.spec.js (drei benannte Durchgaenge)
- FOUND: tests/e2e/test-results/computed-style-snapshot.json (24 Ansichten je Durchgang)
- FOUND: package.json (css-usage:report, css-usage:check)
- FOUND: commit ac743cf in `git log --oneline --all`
- FOUND: commit 256af61 in `git log --oneline --all`
- FOUND: commit d8faea6 in `git log --oneline --all`
- FOUND: commit 85f4726 in `git log --oneline --all`
- All plan-level `<verification>` commands re-run and green (siehe Ratschen-Beweise oben): `npx jest tests/unit/css-usage-report.test.js` 23/23, `node tools/css-usage-report.js`/`--json` deterministisch, `npx playwright test tests/e2e/features/computed-style-diff.spec.js` 3/3 stabil ueber zwei Laeufe, `npm run lint` auf den neuen Dateien 0 Probleme, `npx jest` gesamt 1243/1243, `npx playwright test` gesamt 364 passed/2 skipped, beide Builds erfolgreich

---
*Phase: 15-befundlage-vorlauf*
*Completed: 2026-09-09*
