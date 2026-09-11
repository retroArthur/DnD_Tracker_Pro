---
phase: 15-befundlage-vorlauf
plan: 13
subsystem: testing
tags: [computed-style-diff, playwright, css-regression, baseline, checkpoint-decision]

# Dependency graph
requires:
  - phase: 15-befundlage-vorlauf (Plan 15-12)
    provides: Acht woertlich wiederhergestellte CSS-Regelbloecke (sechs Klassenfamilien) in loot.css/welt.css/initiative.css/npcs.css/dashboard.css, die dieser Plan am gebauten Buendel ueber berechnete Endwerte belegt
provides:
  - "Befuellter Seed (`seedPopulatedSession`) neben dem bestehenden leeren Seed, mit sechs Datensaetzen (Charakter mit Zauberplaetzen, NPC, Ort, Shop mit nicht verfuegbarem Artikel, Fraktion mit beidseitiger Ruf-Historie, Mob-Kombattant) und einer benannten Ansicht-zu-Zustandsherstellung-Konstante"
  - "Dauerhafter Regressionsspec `css-restore-regression.spec.js` mit fuenf Faellen REG-01..REG-05, beidseitig bewiesen fuer die Mob-Ausblendregel"
  - "Reparierter Stil-Vergleichslauf: versionierter Digest-Sollstand (Checkpoint-Entscheidung C), Schreibsperre, beidseitiger Schluesselmengen-Vergleich, befuellter Durchgang mit Zustandsherstellung, gemessene Leerzustand-Schranke fuer vier Ansichten"
  - "Erstmalig erhobener, git-verfolgter Sollstand (`computed-style-baseline.json`, 328.261 Byte), beidseitig bewiesen (Wertaenderung, verschwundenes Element, neu erschienenes Element), Schreibsperre gegen Selbstheilung nachgewiesen"
affects: [16-css-dead-code-entfernung, 17-css-dead-code-entfernung, 18-css-dead-code-entfernung, 19-css-dead-code-entfernung]

# Actuals (#2632)
actuals:
  tokens: 97818
  tasks: 3
  commits: 5
plan_head_before: ad3859ab3f42e2dca36fe503f156ae11e89f79e0

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Digest-Kurzform (gekuerzter SHA-256, 64 Bit) statt Vollabzug fuer einen versionierten Vergleichs-Sollstand — der Vollabzug bleibt lokal unter dem ausgeschlossenen Ergebnisverzeichnis fuer die Fehlersuche"
    - "Schreibsperre + Schreibaufruf-Position (nach der Zusicherung statt davor) als zwei getrennte, beide notwendige Bedingungen gegen einen selbstheilenden Waechter"
    - "Beidseitiger Schluesselmengen-Vergleich (verschwunden UND neu erschienen) statt nur eines einseitigen Diffs ueber gemeinsame Schluessel"
    - "Laufend animierte Elemente (`getComputedStyle().animationName !== 'none'`) aus einem Stil-Vergleichslauf ausschliessen — dieselbe Kategorie wie der bestehende width/height-Ausschluss (Rauschen ohne Aussage)"

key-files:
  created:
    - tests/e2e/features/css-restore-regression.spec.js
    - tests/e2e/baselines/computed-style-baseline.json
  modified:
    - tests/e2e/helpers/test-utils.js
    - tests/e2e/features/computed-style-diff.spec.js
    - .planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md
    - tests/unit/module-test-coverage.test.js

key-decisions:
  - "Checkpoint-Entscheidung (Mensch, 2026-09-11): Option C — Kurzform (Digest) als verbindlicher versionierter Sollstand, Vollabzug zusaetzlich lokal unter dem ausgeschlossenen Ergebnisverzeichnis. Begruendung: ein je Phase neu geschriebener Mehrmegabyte-Sollstand waechst die Git-Historie dauerhaft und ist nicht folgenlos zuruecknehmbar; die Kurzform erkennt beide Richtungen der Schluesselmengen-Aenderung genauso zuverlaessig, bei deutlich kleinerem Umfang."
  - "Digestlaenge auf 64 Bit (16 Hex-Zeichen) gekuerzt statt des vollen 256-Bit-SHA-256 — die Kollisionsdomaene (wenige tausend Elemente je Lauf) macht den vollen Hash ueberdimensioniert; 64 Bit tragen den von der Checkpoint-Option versprochenen Groessenvorteil tatsaechlich in die Datei (gemessen: 328.261 Byte statt der ohne Kuerzung erhobenen 502.711 Byte)."
  - "Laufend animierte Elemente aus dem Stil-Vergleich ausgeschlossen (Rule 1, waehrend Task 3 gefunden): `.dms-live-badge`s `animation: dms-live-pulse 2s ease-in-out infinite` liess `opacity` zwischen zwei Laeufen desselben unveraenderten Baums legitim unterschiedlich sein — reines Zeitrauschen, keine Stiländerung, behandelt wie der bestehende width/height-Ausschluss."
  - "Zwei MODULE_TEST_EXCEPTIONS-Eintraege (shops-core.js, fraktionen-render.js) gestrichen statt die triggernden Kommentare zu verschleiern (Rule 3, blocking): beide Module werden von den neuen REG-Faellen jetzt tatsaechlich zur Laufzeit durchlaufen (window.toggleShop()/window.selectFraktion()) — die Ratsche meldete einen echten Fortschritt, kein Verschleiern haette diesen Fortschritt versteckt. Der dritte Treffer (party-crud.js, reine Kommentar-Zitierung ohne Laufzeitaufruf) wurde stattdessen auf die etablierte nicht-treffende Zitierkonvention umgestellt."

patterns-established: []

requirements-completed: [DEAD-03, GATE-03, GATE-05]

coverage:
  - id: D1
    description: "Befuellter Seed (seedPopulatedSession) und dauerhafter Regressionsspec (REG-01..REG-05) belegen alle vier in Plan 15-12 wiederhergestellten Regelfamilien am gebauten Buendel ueber berechnete Endwerte, inklusive beidseitigem Beweis der Mob-Ausblendregel"
    requirement: GATE-03
    verification:
      - kind: e2e
        ref: "npx playwright test tests/e2e/features/css-restore-regression.spec.js (5 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Stil-Vergleichslauf repariert: versionierter Digest-Sollstand statt Pfad unter dem ausgeschlossenen Ergebnisverzeichnis, Schreibsperre (existenz- und schaltergebunden, nach der Zusicherung), beidseitiger Schluesselmengen-Vergleich, befuellter Durchgang mit Zustandsherstellung fuer Shop/Fraktion"
    requirement: GATE-05
    verification:
      - kind: e2e
        ref: "npx playwright test tests/e2e/features/computed-style-diff.spec.js (3 passed, reproduzierbar ueber drei Laeufe)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Sollstand erstmalig erhoben und git-verfolgt, alle drei Befundarten (Wertaenderung, verschwundenes, neu erschienenes Element) je einmal rot und gruen bewiesen, Schreibsperre im roten Zustand belegt"
    requirement: DEAD-03
    verification:
      - kind: other
        ref: "Messblock 12 in 15-RATCHET-BASELINE.md — acht Exit-Codes, byte-gleicher Vergleich der Sollstandsdatei nach dem roten Lauf"
        status: pass
    human_judgment: false
  - id: D4
    description: "Volle Suiten und beide Builds gruen nach allen Aenderungen"
    requirement: GATE-03
    verification:
      - kind: unit
        ref: "npx jest (1260 passed, 1260 total)"
        status: pass
      - kind: e2e
        ref: "npx playwright test --reporter=list (369 passed, 2 skipped, 0 failed)"
        status: pass
      - kind: other
        ref: "python -m pytest tests/build -q (24 passed); python build.py und python build.py --production (beide Exit 0)"
        status: pass
    human_judgment: false
  - id: D5
    description: "GATE-05 Stufe 3 (menschliche Vier-Themes-Sichtung) NICHT durchgefuehrt — ausdruecklich Plan 15-14 vorbehalten"
    requirement: GATE-05
    verification: []
    human_judgment: true
    rationale: "Erfordert menschliche Sichtprüfung ueber vier Themes; maschinell nicht beurteilbar (PROJECT.md § GATE-05)."

duration: ~75min
completed: 2026-09-11
status: complete
---

# Phase 15 Plan 13: Stil-Vergleichslauf von dekorativ zu lasttragend Summary

**Der computed-style-diff-Wächter vergleicht jetzt tatsächlich gegen einen git-verfolgten Digest-Sollstand (Checkpoint-Option C), kann seinen eigenen Befund nicht mehr selbst wegschreiben, sieht beide Richtungen einer Schlüsselmengen-Änderung, und ein neuer Regressionsspec belegt alle vier in Plan 15-12 wiederhergestellten CSS-Regeln am gebauten Bündel über berechnete Endwerte.**

## Performance

- **Duration:** ~75 min
- **Tasks:** 3 (plus der vorab per Checkpoint entschiedene erste Task)
- **Files modified:** 6 (2 neu: Regressionsspec + versionierter Sollstand; 4 geändert, davon eine — `module-test-coverage.test.js` — als Deviation außerhalb der ursprünglichen `files_modified`)
- **Commits:** 5

## Checkpoint-Entscheidung

**Frage:** In welcher Form wird der Sollstand des Stil-Vergleichslaufs versioniert?

**Entscheidung des Menschen (2026-09-11): Option C — Hybrid.** Der verbindliche, eingecheckte
Sollstand ist eine Kurzform (je Ansicht/Elementschlüssel ein stabiler Hash über die zwölf
Eigenschaften, plus die vollständige Schlüsselmenge); der Vollabzug wird weiterhin — unverändert
wie vor diesem Plan — nur unter dem per `.gitignore` ausgeschlossenen Ergebnisverzeichnis
geschrieben und dient der örtlichen Fehlersuche. Begründung: ein je Phase neu geschriebener
Mehrmegabyte-Sollstand wächst die Git-Historie dauerhaft und ist nicht folgenlos zurücknehmbar;
die Kurzform erkennt Wertänderungen UND beide Richtungen der Schlüsselmengen-Änderung genauso
zuverlässig, bei deutlich kleinerem Umfang, und ihr Diff bleibt zeilenweise lesbar.

Während der Umsetzung zusätzlich auf 64 Bit (16 Hex-Zeichen) gekürzt statt des vollen 256-Bit-
SHA-256 — siehe Deviations.

## Accomplishments

- **Befüllter Seed (`seedPopulatedSession`)** in `tests/e2e/helpers/test-utils.js`, Geschwister
  von `seedCleanSession` (dieser bleibt zeichengleich unverändert): ein Charakter mit
  Zauberplätzen (gefüllter und leerer Pip-Zustand), ein NPC, ein Ort, ein Shop mit einem
  ausdrücklich nicht verfügbaren und einem verfügbaren Artikel, eine Fraktion mit positivem und
  negativem Ruf-Historieneintrag, und ein Mob-Kombattant im N-fachen-Einzelwurf-Modus.
- **Dauerhafter Regressionsspec** `tests/e2e/features/css-restore-regression.spec.js` mit
  `REG-01` bis `REG-05` — fünf Zusicherungen über berechnete Endwerte (`getComputedStyle`) gegen
  das gebaute Bündel, die die vier in Plan 15-12 wiederhergestellten CSS-Regelfamilien belegen.
  Der beidseitige Rot-Grün-Beweis der Mob-Ausblendregel ist protokolliert (siehe Messblock 12).
- **Stil-Vergleichslauf repariert** (`tests/e2e/features/computed-style-diff.spec.js`): der
  Sollstand liegt unter `tests/e2e/baselines/computed-style-baseline.json` (versioniert, nicht
  per `.gitignore` ausgeschlossen); die Schreibsperre (`UPDATE_STYLE_BASELINE=1` oder fehlender
  Sollstand) UND die Schreibposition (nach der Zusicherung) verhindern gemeinsam, dass ein
  gefundener Befund im selben Lauf als neuer Sollstand festgeschrieben wird; `diffPass()` meldet
  jetzt drei Befundarten (geänderter Digest, verschwundener Schlüssel, neu erschienener
  Schlüssel); alle drei Durchgänge nutzen `seedPopulatedSession` plus eine benannte
  `VIEW_STATE_SETUP`-Konstante (Shop aufklappen, Fraktion auswählen); eine gemessene
  `MIN_ELEMENTS_ABOVE_EMPTY`-Schranke für vier Ansichten (party/shops/fraktionen/initiative)
  macht einen stillen Rückfall auf Leerzustands-Markup rot statt grün.
- **Erwartungsliste `EXPECTED_DEVIATION_KEYS` auf leer gesetzt**, mit einer Regel im Kommentar,
  wann künftig wieder ein Eintrag hineingehört (nur für die Dauer der Welle, die eine berechnete
  Stiländerung absichtlich herbeiführt, mit Plan-Nennung).
- **Sollstand erstmalig erhoben und git-verfolgt** (328.261 Byte, ~5x kleiner als der lokale
  Vollabzug mit ~1,58 MiB); alle drei Befundarten je einmal rot und grün bewiesen; die
  Schreibsperre im roten Zustand belegt (byte-gleicher Vergleich nach dem roten Lauf).
- **Messblock 12** in `15-RATCHET-BASELINE.md` mit allen acht Exit-Codes, der gemessenen
  Sollstandsgröße, den Elementzahlen je Ansicht (befüllt vs. Leerzustand) und dem
  Entscheidungsabschnitt.

## Rot-Grün-Protokolle (GATE-03, D-49)

### Task 1 — Regressionsspec, Mob-Ausblendregel

| # | Zustand | Ergebnis | Exit-Code |
|---|---|---|---|
| 1 | `.init-mob-dmg-inputs.hidden` entfernt | ROT — REG-04 fehlgeschlagen ("none" erwartet, "flex" erhalten), REG-05 grün | 1 |
| 2 | Regel wiederhergestellt | GRÜN — 5/5 | 0 |

### Task 3 — drei Befundarten des reparierten Vergleichslaufs

| # | Probe | Ergebnis | Exit-Code |
|---|---|---|---|
| 1 | (a) `.si-unavailable` Deckkraft 0,5→0,4 | ROT — Digest geändert bei `shops/div.misc.si-item.si-unavailable#0` | 1 |
| 2 | (a) zurückgenommen | GRÜN — 3/3 | 0 |
| 3 | (b) `.fr-hist-minus` `display: none` ergänzt | ROT — `fraktionen/span.fr-hist-delta.fr-hist-minus#0` als verschwunden gemeldet | 1 |
| 4 | (b) zurückgenommen | GRÜN — 3/3 | 0 |
| 5 | (c) Mob-Ausblendregel entfernt | ROT — drei Schlüssel als neu erschienen gemeldet (`.init-mob-dmg-inputs`, `.init-mob-ac-input`, `.init-mob-bonus-input`) | 1 |
| 6 | (c) zurückgenommen | GRÜN — 3/3 | 0 |

Zusätzlich die **Schreibsperren-Probe**: während Probe (a) im roten Zustand wurde die
Sollstandsdatei vor und nach dem roten Lauf verglichen — byte-gleich. Nach jeder Probe:
`git status --porcelain assets/styles/` leer.

Insgesamt acht protokollierte Exit-Codes über Task 1 und Task 3, vier davon ungleich 0 —
Kriterium erfüllt.

## Task Commits

1. **Task 1: Befüllter Seed und Regressionsspec** — `a2383e3` test(15-13): add populated seed and REG-01..REG-05 regression spec for restored CSS rules
2. **Task 2: Stil-Vergleichslauf reparieren (initiale Fassung, Vollabzug statt Digest)** — `e13a337` fix(15-13): repair computed-style-diff to compare against a versioned, write-locked baseline
3. **Deviation-Fix: Digest-Form gemäß Checkpoint-Entscheidung, Animations-Ausschluss** — `3bd4650` fix(15-13): match Task 2 baseline shape to the resolved checkpoint decision (hybrid digest)
4. **Deviation-Fix: module-test-coverage-Ratsche** — `325cf7e` fix(15-13): shrink module-test-coverage exception list, defuse a false-positive citation
5. **Task 3: Sollstand erheben, beidseitig beweisen, Messblock 12** — `874c65d` docs(15-13): erect the versioned style baseline, prove all three regression classes, Messblock 12

**Plan metadata:** (dieser Commit)

## Files Created/Modified

- `tests/e2e/helpers/test-utils.js` — `seedPopulatedSession` neuer Export
- `tests/e2e/features/css-restore-regression.spec.js` — neu, fünf Fälle REG-01..REG-05
- `tests/e2e/features/computed-style-diff.spec.js` — versionierter Digest-Sollstand, Schreibsperre, beidseitiger Vergleich, `VIEW_STATE_SETUP`, `MIN_ELEMENTS_ABOVE_EMPTY`, animierte Elemente ausgeschlossen
- `tests/e2e/baselines/computed-style-baseline.json` — neu, versionierter Sollstand (328.261 Byte)
- `.planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md` — `## Messblock 12`
- `tests/unit/module-test-coverage.test.js` — zwei Ausnahmeliste-Einträge gestrichen (Deviation)

## Decisions Made

Siehe `key-decisions` im Frontmatter (Checkpoint-Option C, Digestlänge 64 Bit, Ausschluss
animierter Elemente, Ratschen-Fix statt Kommentar-Verschleierung).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Task 2 schrieb initial den Vollabzug statt der im Checkpoint gewählten Digestform in den versionierten Pfad**
- **Found during:** Vorbereitung von Task 3 (Sollstand-Erhebung), beim Messen der Dateigröße
- **Issue:** Die erste Fassung von `computed-style-diff.spec.js` (Commit `e13a337`) schrieb die
  vollständigen berechneten Rohwerte direkt nach `tests/e2e/baselines/computed-style-baseline.json`
  (gemessen: 1.662.663 Byte) — das ist Option A (Vollabzug), nicht die vom Menschen gewählte
  Option C (Digest). Der Fehler wurde vor jedem Commit von Task 3 entdeckt und behoben, bevor der
  verbindliche Sollstand je in dieser falschen Form erhoben wurde.
- **Fix:** `toDigestPass()`/`digestElement()`/`diffPass()` auf Digestvergleich umgestellt; der
  Vollabzug wird weiterhin (unverändert wie vor diesem Plan) unter dem ausgeschlossenen
  Ergebnisverzeichnis geschrieben, jetzt unter dem expliziten Namen
  `tests/e2e/test-results/computed-style-snapshot.json`, für die örtliche Fehlersuche.
- **Files modified:** `tests/e2e/features/computed-style-diff.spec.js`
- **Verification:** Sollstand danach 328.261 Byte statt 1.662.663 Byte; alle Task-2-Akzeptanzkriterien erneut geprüft (grep-Checks + `npm run lint`)
- **Committed in:** `3bd4650`

**2. [Rule 1 - Bug] `.dms-live-badge`s Pulsanimation machte zwei Erfassungen desselben unveränderten Baums legitim unterschiedlich**
- **Found during:** Reproduzierbarkeits-Probe vor Task 3 (Lauf ohne Schalter gegen den frisch erhobenen Sollstand)
- **Issue:** `.dms-live-badge` trägt `animation: dms-live-pulse 2s ease-in-out infinite;`, die
  `opacity` zwischen 1 und 0,6 pulsieren lässt. `opacity` ist eine der zwölf verglichenen
  Eigenschaften — zwei Erfassungen zu unterschiedlichen Zeitpunkten im Animationszyklus lieferten
  unterschiedliche Werte, obwohl sich am Baum nichts geändert hatte.
- **Fix:** `captureViewInBrowser()` schließt Elemente mit laufender Animation
  (`getComputedStyle(el).animationName !== 'none'`) aus der erfassten/verglichenen Menge aus —
  dieselbe Kategorie wie der bestehende Ausschluss von width/height. `elementCount` bleibt
  unberührt.
- **Files modified:** `tests/e2e/features/computed-style-diff.spec.js`
- **Verification:** Drei aufeinanderfolgende Läufe gegen den unveränderten Baum, alle drei grün, Sollstand byte-gleich
- **Committed in:** `3bd4650` (im selben Commit wie Deviation 1, derselbe Reproduzierbarkeits-Nachweis)

**3. [Rule 3 - Blocking] `module-test-coverage.test.js`s Ratsche schlug durch neue, wörtliche Modulpfad-Erwähnungen fehl**
- **Found during:** Voller `npx jest`-Lauf vor Task 3s Abschlussprüfung
- **Issue:** `npx jest` schlug fehl — `module-test-coverage.test.js` meldete drei
  `MODULE_TEST_EXCEPTIONS`-Einträge (`features/fraktionen/fraktionen-render.js`,
  `features/party/party-crud.js`, `features/shops/shops-core.js`) als "jetzt abgedeckt", weil
  ihre wörtlichen Pfade in neuen Testdateikommentaren vorkommen (`isCovered()` ist eine reine
  Zeichenketten-Suche über `tests/`, keine echte Aufrufanalyse) — dieselbe Fehlerklasse wie
  Plan 15-12s Deviation 1, in derselben Datei.
- **Fix:** Unterschieden statt pauschal behandelt: `shops-core.js` und `fraktionen-render.js`
  werden von den neuen REG-Fällen tatsächlich zur Laufzeit durchlaufen
  (`window.toggleShop()`/`window.selectFraktion()`) — beide Einträge aus
  `MODULE_TEST_EXCEPTIONS` gestrichen (die Ratsche meldete einen echten Fortschritt). Der dritte
  Treffer (`party-crud.js`) war eine reine Zitat-Erwähnung im Seed-Kommentar ohne
  Laufzeitaufruf — dort die etablierte nicht-treffende Zitierkonvention verwendet
  (`party-crud.js` (im `features/party/`-Verzeichnis)) statt eines Streichens.
- **Files modified:** `tests/unit/module-test-coverage.test.js`, `tests/e2e/helpers/test-utils.js`
- **Verification:** `npx jest` → 56/56 Suiten, 1260/1260 Tests, Exit-Code 0
- **Committed in:** `325cf7e`

---

**Total deviations:** 3 auto-fixed (2 Rule 1 — eigene Fehler in der ersten Task-2-Fassung sofort
korrigiert, 1 Rule 3 — Ratschen-Kollision sofort behoben, alle vor Abschluss des Plans).
**Impact on plan:** Alle drei Auto-Fixes waren nötig, um die eigenen Akzeptanzkriterien dieses
Plans (Checkpoint-Form, Reproduzierbarkeit, grüne volle Suite) zu erfüllen. Kein Scope-Creep —
`tools/css-usage-report.js` wurde nicht angefasst, kein anderer Spec geändert.

## Issues Encountered

Keine über die oben dokumentierten Deviations hinaus.

## User Setup Required

None - keine externe Service-Konfiguration erforderlich.

## Next Phase Readiness

- Die dritte Nachweissäule dieser Phase (`computed-style-diff.spec.js`) vergleicht ab jetzt in
  jedem Klon und in CI gegen denselben versionierten Digest-Sollstand, kann ihren eigenen Befund
  nicht mehr wegschreiben, sieht beide Richtungen einer Schlüsselmengen-Änderung, und rendert die
  Entitäten, auf die gelöschtes CSS überhaupt wirkt.
- Die Phasen 16-19 müssen `UPDATE_STYLE_BASELINE=1` setzen, sobald sie berechnete Stile absichtlich
  ändern, und dabei `EXPECTED_DEVIATION_KEYS` für die Dauer der jeweiligen Welle befüllen (Regel im
  Kommentar der Datei).
- `tests/e2e/features/css-restore-regression.spec.js` steht als dauerhafter Regressionsspec für
  die vier in Plan 15-12 wiederhergestellten CSS-Regeln und läuft ab jetzt bei jedem
  Playwright-Lauf mit.
- **GATE-05 Stufe 3 (menschliche Vier-Themes-Sichtung) wurde durch diesen Plan NICHT
  durchgeführt** — ausdrücklich Plan 15-14 vorbehalten.
- Bereit für Plan 15-14.

## Self-Check: PASSED

---
*Phase: 15-befundlage-vorlauf*
*Completed: 2026-09-11*
