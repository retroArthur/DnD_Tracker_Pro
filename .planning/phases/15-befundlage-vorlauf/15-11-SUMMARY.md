---
phase: 15-befundlage-vorlauf
plan: 11
subsystem: testing
tags: [css-usage-report, dead-css, static-analysis, tdd]

# Dependency graph
requires:
  - phase: 15-befundlage-vorlauf (Plan 15-09)
    provides: Lebend-Erkennung mit CR-01a/b/c/WR-01 (Ternary rechts von .className=, className:/containerClass:-Objektschluessel, classList.*-Klammertiefe)
provides:
  - Interpolations-Literal-Ernte (addTokensFromInterpolation) statt pauschalem Verwerfen von ${...}-Inhalten
  - MAX_SEGMENT_SCAN_CHARS (2000) als harte Zeichen-Obergrenze statt der Zeilenumbruch-Abbruchbedingung in scanBalancedSegment()
  - Vierte Kontextregel collectConcatVarLiterals() fuer die Zwischenvariablen-Form (var/let/const-Deklaration, danach in derselben Anweisung wie ein class="..."-Vorkommen konkateniert)
  - Frisch gemessener Pruefmodus-Stand (checkFailures.length 199 -> 159) in Messblock 10
affects: [16-css-dead-code-entfernung, 17-css-dead-code-entfernung, 18-css-dead-code-entfernung, 19-css-dead-code-entfernung]

# Actuals (#2632)
actuals:
  tokens: 7890
  tasks: 3
  commits: 10

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Klammertiefe-/Anfuehrungszeichen-bewusster Textscan (scanBalancedSegment) als wiederverwendete Maschinerie fuer mehrere Klassen-Kontexte"
    - "Anweisungsweiter Scan mit fester Zeichen-Obergrenze statt Zeilenumbruch-Abbruch, gegen unbegrenzte Leseweite bei unbeendeten Konstrukten"
    - "Deklarations-Zuordnung (Name -> Literale) einmal je Dateiinhalt aufbauen statt je Kandidat neu suchen, um quadratisches Verhalten zu vermeiden"

key-files:
  created: []
  modified:
    - tools/css-usage-report.js
    - tests/unit/css-usage-report.test.js
    - .planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md
    - .planning/phases/15-befundlage-vorlauf/deferred-items.md

key-decisions:
  - "Statement-Scan fuer die Zwischenvariablen-Form beginnt NACH der class=-Attributwertgrenze (any-of-three-quotes-Regel), nicht direkt nach der class=-Anfuehrung selbst — sonst verschiebt sich die Anfuehrungs-Paritaet und QUOTED_STRING_RE paart faelschlich ueber die Grenze zwischen zwei getrennten JS-Literalen hinweg, wodurch der konkatenierte Bezeichner verloren ginge (empirisch an beiden realen Fundstellen geprueft, bevor die Regel geschrieben wurde)"
  - "MAX_SEGMENT_SCAN_CHARS = 2000, einheitlich fuer alle anweisungsweiten Scans (auch die neue vierte Kontextregel) — keine zweite, abweichende Schranke"
  - "Deklarations-Zuordnung (collectVarDeclarationLiterals) wird EINMAL je Dateiinhalt gebaut, nicht je Kandidat neu durchsucht — vermeidet die quadratische Form, die in der Planungssimulation nicht innerhalb von zwei Minuten durchlief"

patterns-established:
  - "Vor dem Schreiben einer neuen Textscan-Regel den Mechanismus an einem isolierten Node-Probe-Skript gegen die REALE Fundstelle verifizieren, bevor er in die Produktionsdatei geschrieben wird — hat hier einen stillen Fehlschlag (Verschlucken des konkatenierten Bezeichners durch falsch gepaarte Anfuehrungszeichen) vor der Implementierung aufgedeckt, nicht erst im roten Testlauf"

requirements-completed: [DEAD-01, DEAD-02, GATE-03]

coverage:
  - id: D1
    description: "Interpolationsinhalt (${...}) wird nach Zeichenketten-Literalen durchsucht statt pauschal verworfen; Bedingungsvariablen-Name bleibt kein Token"
    requirement: DEAD-01
    verification:
      - kind: unit
        ref: "tests/unit/css-usage-report.test.js#CR-03a: eine ${...}-Interpolation mit einer Ternary aus zwei Zeichenketten-Literalen in einem class=\"...\"-Attribut haelt BEIDE Literale lebendig"
        status: pass
    human_judgment: false
  - id: D2
    description: "scanBalancedSegment() bricht nicht mehr bei jedem Zeilenumbruch ab; MAX_SEGMENT_SCAN_CHARS (2000) verhindert unbegrenzte Leseweite bei unbeendeten Konstrukten"
    requirement: DEAD-02
    verification:
      - kind: unit
        ref: "tests/unit/css-usage-report.test.js#CR-02a/CR-02b/CR-02c"
        status: pass
    human_judgment: false
  - id: D3
    description: "Vierte Kontextregel: eine per var/let/const aus Ternary-Literalen deklarierte Zwischenvariable, die in derselben Anweisung wie ein class=\"...\"-Vorkommen konkateniert wird, haelt ihre Literale lebendig; Praezisions-Gegenprobe verhindert eine Pauschalfreigabe"
    requirement: DEAD-01
    verification:
      - kind: unit
        ref: "tests/unit/css-usage-report.test.js#CR-03b/CR-03c"
        status: pass
    human_judgment: false
  - id: D4
    description: "Rot-Gruen-Nachweis fuer alle sechs neuen Faelle protokolliert, Messblock 10 mit vollstaendigem Protokoll in 15-RATCHET-BASELINE.md"
    requirement: GATE-03
    verification:
      - kind: unit
        ref: "npx jest tests/unit/css-usage-report.test.js (33 passed, 33 total)"
        status: pass
    human_judgment: false

duration: 65min
completed: 2026-09-11
status: complete
---

# Phase 15 Plan 11: Dead-CSS-Werkzeug — Umbruchschranke, Interpolations-Ernte, Zwischenvariablen-Kontext Summary

**Drei mechanische Erkennungslücken in `tools/css-usage-report.js` geschlossen (Interpolations-Literal-Ernte, Zeichen-Obergrenze statt Zeilenumbruch-Abbruch, vierte Kontextregel für Zwischenvariablen), Prüfmodus-Stand frisch gemessen: 199 → 159 tote Klassen außerhalb der Ausnahmeliste.**

## Performance

- **Duration:** ~65 min
- **Tasks:** 3
- **Files modified:** 4 (`tools/css-usage-report.js`, `tests/unit/css-usage-report.test.js`, `15-RATCHET-BASELINE.md`, `deferred-items.md`)
- **Commits:** 10

## Accomplishments

- **Interpolations-Literal-Ernte (CR-03a):** `scanClassContextValue()` und `addTokensFromValue()` ernten jetzt die Zeichenketten-Literale aus einer `${...}`-Interpolation über eine neue Funktion `addTokensFromInterpolation()`, statt den gesamten Interpolationsinhalt zu verwerfen — der übrige Ausdruckstext (z. B. der Name der Bedingungsvariablen) bleibt weiterhin kein Token.
- **Zeichen-Obergrenze statt Umbruchschranke (CR-02):** `scanBalancedSegment()` bricht nicht mehr bei jedem Zeilenumbruch ab; eine über zwei Zeilen umbrochene Zuweisung (Prettier-Normalform) liefert jetzt alle ihre Literale. Die neue Konstante `MAX_SEGMENT_SCAN_CHARS` (2000) verhindert dabei unbegrenzte Leseweite bei einem unbeendeten Konstrukt.
- **Vierte Kontextregel für die Zwischenvariablen-Form (CR-03b):** `collectConcatVarLiterals()` erkennt einen Bezeichner, der per `var`/`let`/`const` aus Zeichenketten-Literalen deklariert und danach innerhalb derselben Anweisung wie ein `class="..."`-Vorkommen konkateniert wird — mit einer Präzisions-Gegenprobe (CR-03c), die eine Pauschalfreigabe für jede Ternary-Variable im Baum verhindert.
- **Frisch gemessener Prüfmodus-Stand:** `checkFailures.length` sinkt von 199 auf **159** (40 Klassen freigegeben, 0 neu tot — die Erweiterung ist strikt konservativ). Alle vier von `15-VERIFICATION.md`/`15-REVIEW.md` namentlich benannten Klassen (`si-unavailable`, `filled`, `proficient`, `hidden`) stehen danach nachweislich nicht mehr in `checkFailures`.
- **Messblock 10** in `15-RATCHET-BASELINE.md` dokumentiert das vollständige Rot-Grün-Protokoll aller sechs neuen Testfälle sowie die Vorher-/Nachher-Zahl und die 40 namentlich freigegebenen Klassen.

## Task Commits

Jeder Task folgte dem RED → GREEN-Zyklus mit einem eigenen Commit je Phase:

1. **Task 1: Interpolationsinhalt ernten** —
   `71925a3` test(15-11): add failing CR-03a case for interpolation literal harvest (RED) →
   `b7431c8` feat(15-11): harvest string literals out of class-context interpolations (GREEN)
2. **Task 2: Umbruchschranke durch harte Zeichen-Obergrenze ersetzen** —
   `8f32e73` test(15-11): add failing CR-02a/CR-02b cases for the newline scan barrier (RED) →
   `7d15c36` feat(15-11): replace the newline scan barrier with a character cap (GREEN) →
   `0efaf9a` docs(15-11): log pre-existing lint failure as out-of-scope deferred item
3. **Task 3: Vierte Kontextregel, Neumessung, Messblock 10** —
   `4781056` test(15-11): add failing CR-03b case for the intermediate-variable form (RED) →
   `5aea09f` feat(15-11): recognize the intermediate-variable class concatenation form (GREEN) →
   `7f16c5d` fix(15-11): avoid literal loader.js module paths in test comments →
   `cbb9a0e` fix(15-11): put CR-03c's colon immediately after its marker →
   `24050cb` docs(15-11): record Messblock 10 — fresh check-mode measurement

_Note: Zwei zusätzliche Fix-Commits (`7f16c5d`, `cbb9a0e`) korrigieren Regressionen, die diese Tasks selbst verursacht haben — siehe Deviations unten._

## Rot-Grün-Protokoll (GATE-03)

```
Task 1 — CR-03a gegen das unveraenderte Werkzeug:
npx jest tests/unit/css-usage-report.test.js
Tests:       1 failed, 27 passed, 28 total
Exit-Code:   1
Fehlgeschlagener Fall: CR-03a

Task 1 — nach der Interpolations-Literal-Ernte:
Tests:       28 passed, 28 total
Exit-Code:   0

Task 2 — CR-02a/CR-02b gegen den Stand nach Task 1 (CR-02c bereits gruen):
Tests:       2 failed, 29 passed, 31 total
Exit-Code:   1
Fehlgeschlagene Faelle: CR-02a, CR-02b

Task 2 — nach dem Ersatz der Umbruchschranke durch MAX_SEGMENT_SCAN_CHARS:
Tests:       31 passed, 31 total
Exit-Code:   0

Task 3 — CR-03b gegen den Stand nach Task 2 (CR-03c bereits gruen, muss es bleiben):
Tests:       1 failed, 32 passed, 33 total
Exit-Code:   1
Fehlgeschlagener Fall: CR-03b

Task 3 — nach der vierten Kontextregel (collectConcatVarLiterals):
Tests:       33 passed, 33 total
Exit-Code:   0
```

## Frisch gemessener Prüfmodus-Stand

```
node tools/css-usage-report.js --json
```

| Zeitpunkt | Wert |
|---|---|
| Vorher (Ausgangswert, Messblock 8, Plan 15-09) | 199 |
| Nachher (diese Sitzung, nach allen drei Tasks) | **159** |

Zwei aufeinanderfolgende Läufe liefern byte-gleiche Ausgabe. `si-unavailable`, `filled`, `proficient` und `hidden` sind nachweislich nicht mehr in `checkFailures` enthalten.

**Namentlich freigegebene Klassen (40):** `ally`, `arcana`, `available`, `bloodied`, `buff`, `character`, `completed`, `critical`, `custom`, `defeated`, `ds-toggle-btn--active`, `error`, `expertise`, `expired`, `filled`, `full`, `gestik`, `half`, `has-children`, `healing`, `healthy`, `hidden`, `history`, `inactive`, `investigation`, `locations-list`, `material`, `misc`, `missing`, `nature`, `pinned`, `player`, `plot`, `proficient`, `religion`, `sb-file-warn`, `si-unavailable`, `side`, `srd`, `verbal`

**0 Klassen sind neu als tot aufgetaucht** — die Erweiterung erklärt ausschließlich mehr Klassen für lebendig, nie weniger (strikt konservativ).

`DEAD_EXCEPTIONS` bleibt bei genau fünf Einträgen, `LIVE_PREFIXES` bei genau fünf — kein einziger Klassenname wurde in eine Ausnahmeliste eingetragen; die Erweiterung ist durchgehend mechanisch.

## `.planning/WINDOWS.md` — ausdrücklich unberührt

`.planning/WINDOWS.md` wurde in diesem Plan bewusst NICHT angefasst (`git status --porcelain .planning/WINDOWS.md` ist nach jedem Task leer geblieben). Eintrag 5 trägt weiterhin die Zahl 199, nicht die hier gemessenen 159 — er wird erst durch Plan 15-12 nachgezogen, nachdem auch die dortigen CSS-Wiederherstellungen stehen. Eine zwischenzeitliche Aktualisierung hätte die Registerzahl innerhalb derselben Welle zweimal umgeschrieben.

(Ein Ausführungsfehler meinerseits hätte beinahe genau das getan: ein `windows.append`-Aufruf für einen unrelated Lint-Befund legte versehentlich einen neuen Eintrag 7 an. Sofort per `git checkout -- .planning/WINDOWS.md` rückgängig gemacht, bevor irgendetwas committet wurde — siehe Deviations.)

## GATE-05 — ausdrücklich NICHT durchgeführt

Dieser Plan erfüllt GATE-05 Stufe 1 (grüne Suiten, durchlaufende Builds). **Stufe 3 (die menschliche Vier-Themes-Sichtung) wurde durch diesen Plan NICHT durchgeführt** — der Plan ändert kein ausgeliefertes CSS, kein Markup und keinen Laufzeit-JavaScript-Code; er berührt ausschließlich ein Bauzeit-Werkzeug und seine Testdatei.

## Files Created/Modified

- `tools/css-usage-report.js` — vier neue Exporte (`addTokensFromInterpolation`, `MAX_SEGMENT_SCAN_CHARS`, `collectConcatVarLiterals`, `CONCAT_IDENT_RE`); `scanBalancedSegment()` bricht nicht mehr bei Zeilenumbruch ab; `collectLiveTokens()` hat eine sechste Kontextschleife
- `tests/unit/css-usage-report.test.js` — sechs neue Testfälle (`CR-03a`, `CR-02a`, `CR-02b`, `CR-02c`, `CR-03b`, `CR-03c`; 27 → 33 Fälle)
- `.planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md` — neuer Abschnitt `## Messblock 10`
- `.planning/phases/15-befundlage-vorlauf/deferred-items.md` — neuer Punkt 3 (vorbestehender, unbeteiligter Lint-Befund)

## Decisions Made

- Der Statement-Scan für die Zwischenvariablen-Form beginnt NACH der `class=`-Attributwertgrenze (dieselbe "eine der drei Anführungsarten schließt"-Regel wie `scanClassContextValue()`), nicht direkt nach der `class=`-Anführung selbst. Empirisch geprüft (isoliertes Node-Probe-Skript gegen beide reale Fundstellen, `features/fraktionen/fraktionen-render.js` und `features/initiative-mob.js`, vor dem Schreiben der Produktionsregel): ein direkter Start hinter der `class=`-Anführung landet mitten in einem bereits offenen JS-Zeichenkettenliteral, verschiebt die Anführungs-Parität, und `QUOTED_STRING_RE` paart dann fälschlich über die Grenze zwischen zwei getrennten JS-Literalen hinweg — der konkatenierte Bezeichner (`deltaClass`/`dmgInputsClass`) würde dabei lautlos verschluckt, ohne dass ein einfacher roter Testlauf das anzeigt (die eigenen, selbst geschriebenen Testfixtures hätten denselben Fehler unbemerkt gelassen, wenn nicht vorher am realen Muster geprüft worden wäre).
- `MAX_SEGMENT_SCAN_CHARS = 2000` gilt einheitlich für alle anweisungsweiten Scans, auch für die neue vierte Kontextregel — keine zweite, abweichende Schranke.
- Die Deklarations-Zuordnung (`collectVarDeclarationLiterals`) wird EINMAL je Dateiinhalt aufgebaut, nicht je Kandidat neu durchsucht — vermeidet die quadratische Form.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `module-test-coverage.test.js`-Ratsche durch literale Pfad-Erwähnungen in Testkommentaren gebrochen**
- **Found during:** Task 3, Schritt FÜNFTENS (vollständige Suiten fahren)
- **Issue:** Vier von diesem Plan neu geschriebene "Reale Form aus `<pfad>`"-Kommentare (Task 1/2/3) verwendeten den vollen `loader.js`-relativen Pfad (z. B. `features/dice/dice-core.js:379-381`). `tests/unit/module-test-coverage.test.js` behandelt jedes wörtliche Vorkommen eines solchen Pfads unter `tests/` als "abgedeckt" — unabhängig davon, ob ein Test das Modul tatsächlich lädt. Das kippte vier `MODULE_TEST_EXCEPTIONS`-Einträge fälschlich auf "abgedeckt" und brach die Ratsche ("kein Eintrag der Ausnahmeliste ist inzwischen abgedeckt").
- **Fix:** Auf dieselbe sichere Konvention umgestellt, die die eigenen, vorbestehenden CR-01a/CR-01b-Kommentare dieser Datei bereits verwenden (`safe-render.js (im ui/-Verzeichnis)` statt `ui/safe-render.js`) — Dateiname plus Prosa-Verzeichnishinweis, kein zusammengesetzter Pfad-String. Kein Testverhalten geändert.
- **Files modified:** `tests/unit/css-usage-report.test.js`
- **Verification:** `npx jest` → 1257 passed, 1257 total (vorher 1 failed)
- **Committed in:** `7f16c5d`

**2. [Rule 1 - Bug] `CR-03c`-Testname erfüllte das eigene Akzeptanzkriterium nicht**
- **Found during:** Task 3, Selbstprüfung der Akzeptanzkriterien
- **Issue:** Der Testname lautete `'CR-03c (Praezisions-Gegenprobe): ...'` — das Akzeptanzkriterium verlangt `grep -cE "test\('CR-03[bc]:"` gleich 2; durch das Klammer-Einschub zwischen Marker und Doppelpunkt lieferte der Befehl nur 1.
- **Fix:** Umbenannt zu `'CR-03c: Praezisions-Gegenprobe — ...'` (Doppelpunkt direkt nach dem Marker). Kein Testverhalten geändert.
- **Files modified:** `tests/unit/css-usage-report.test.js`
- **Verification:** `grep -cE "test\('CR-03[bc]:" tests/unit/css-usage-report.test.js` → 2; `npx jest tests/unit/css-usage-report.test.js` → 33 passed
- **Committed in:** `cbb9a0e`

**3. [Rule 3 - Blocking, teilweise nicht behebbar] Ausführungsfehler: `windows.append` versehentlich für einen unrelated Befund aufgerufen**
- **Found during:** Task 2 (Dokumentation des vorbestehenden Lint-Befunds)
- **Issue:** Beim Dokumentieren des vorbestehenden, unbeteiligten Lint-Befunds (siehe unten) wurde versehentlich `gsd-tools query windows.append` aufgerufen, was einen neuen Eintrag 7 in `.planning/WINDOWS.md` anlegte — entgegen der ausdrücklichen Planvorgabe, diese Datei in diesem Plan nicht anzufassen.
- **Fix:** Sofort per `git checkout -- .planning/WINDOWS.md` rückgängig gemacht, BEVOR irgendetwas committet wurde. Stattdessen ausschließlich in `deferred-items.md` dokumentiert (kein WINDOWS.md-Eintrag für diesen Fund).
- **Files modified:** keine (Änderung wurde vor jedem Commit zurückgesetzt)
- **Verification:** `git status --porcelain .planning/WINDOWS.md` leer nach jedem nachfolgenden Task
- **Committed in:** n/a (nie committet)

### Nicht behobene, aus dem Scope ausgeschlossene Befunde

**4. [Scope Boundary] `npm run lint` war bereits vor diesem Plan rot — unbeteiligte `Anpassungen/`-Datei**
- **Found during:** Task 2, Akzeptanzkriterium "`npm run lint` bleibt innerhalb seiner Warnungsgrenze"
- **Issue:** `Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/support.js` (zuletzt geändert in Commit `05515de`, lange vor Phase 15) wirft 5 `no-undef`-Fehler (`customElements`, `URLSearchParams`) und trägt die Gesamtwarnungszahl auf 371 — über die gepinnte Grenze `--max-warnings 367`.
- **Warum nicht behoben:** Diese Datei ist in keinem `files_modified` dieses Plans genannt und wurde von keinem Commit dieser Phase berührt. `npx eslint tools/ tests/unit/css-usage-report.test.js` (nur die von diesem Plan geänderten Dateien) meldet 0 Probleme — die Erweiterung selbst führt keinen einzigen neuen Lint-Befund ein. Scope-Boundary-Regel: nur direkt vom aktuellen Task verursachte Probleme werden automatisch behoben.
- **Dokumentiert in:** `deferred-items.md`, Punkt 3

---

**Total deviations:** 3 auto-fixed (2 Rule 1 — eigene Regressionen sofort gefixt, 1 Rule 3 — Ausführungsfehler sofort zurückgesetzt), 1 dokumentiert und bewusst nicht behoben (Scope Boundary).
**Impact on plan:** Alle Auto-Fixes waren notwendig, um die eigenen Task-3-Akzeptanzkriterien zu erfüllen; kein Scope-Creep. Der vorbestehende Lint-Befund blockiert keine Kernfunktionalität dieses Plans (das Werkzeug selbst und seine Testdatei sind lint-sauber).

## Issues Encountered

Keine über die oben dokumentierten Deviations hinaus.

## User Setup Required

None - keine externe Service-Konfiguration erforderlich.

## Next Phase Readiness

- Das Dead-CSS-Werkzeug erkennt jetzt vier Klassen-Kontexte (Wort-Token-Gleichheit inkl. Zwischenvariablen-Form) plus Interpolations-Literal-Ernte; der Prüfmodus-Stand ist frisch gemessen (159 statt 199).
- `.planning/WINDOWS.md` Eintrag 5 bleibt bewusst bei 199, bis Plan 15-12 die dortigen CSS-Wiederherstellungen abgeschlossen und die Registerzahl einmalig nachgezogen hat.
- Ein vorbestehender, unbeteiligter Lint-Befund (`Anpassungen/`-Verzeichnis) bleibt offen in `deferred-items.md` — blockiert nicht diesen Plan, aber sollte vor `/gsd-ship` gesehen werden.
- Bereit für Plan 15-12.

## Self-Check: PASSED

---
*Phase: 15-befundlage-vorlauf*
*Completed: 2026-09-11*
