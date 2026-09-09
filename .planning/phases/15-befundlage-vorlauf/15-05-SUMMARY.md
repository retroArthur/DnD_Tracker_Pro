---
phase: 15-befundlage-vorlauf
plan: 05
subsystem: ui-bugfix
tags: [playwright, party, dice, spell-slots, event-delegation, ratchet]

# Dependency graph
requires:
  - phase: 15-04
    provides: "tests/e2e/features/design-fixes.spec.js als gemeinsamer Abnahme-Ort fuer alle sichtbaren Design-Defekte dieser Phase"
provides:
  - "Kompakte Zauberplatz-Anzeige der Charakterkarte rendert, ist klickbar und persistiert ueber einen Neuladen (FIX-02)"
  - "Wuerfelergebnis der Hauptansicht behaelt seine Formatierung und zeigt Kritisch-/Patzerfaerbung auf der Zahl selbst (FIX-03)"
  - "Sechs neue Playwright-Faelle in tests/e2e/features/design-fixes.spec.js, beide mit rot bewiesenem Vorlauf"
  - "ROADMAP-Erfolgskriterium 4 nennt den tatsaechlich implementierten Selektor (.spell-slots-compact .slot-pip) statt der D-15-Vermutung"
affects: [15-06, 15-07, 15-08, "16"]

# Actuals (#2632)
actuals:
  tokens: 3800
  tasks: 3
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Renderfunktion liest die kanonische {max, current}-Datenform defensiv, ohne die initialisierende/mutierende Hilfsfunktion aufzurufen (T-15-11) — eine Renderfunktion darf gespeicherten Zustand nicht als Nebenwirkung des Zeichnens umschreiben"
    - "Attributvertrag mit ui/event-delegation.js: erzeugtes Markup verwendet ausschliesslich data-id/data-value, weil genau diese zwei Attribute in ctx.id/ctx.value uebersetzt werden — keine eigene Attributbenennung parallel zum Handler-Vertrag"
    - "Bei zwei parallelen, aber inkompatiblen CSS-Klassenfamilien fuer dieselbe Komponente gewinnt die bereits gestylte Familie (hier: spell-slots-compact/slot-pip aus dashboard.css statt der regelfreien char-card-slots/char-slot-pip-Familie) — keine neue CSS-Regel noetig (D-14)"
    - "Deterministische E2E-Ausloesung ueber die global erreichbare Anzeigefunktion (displayDiceResult) statt auf einen zufaelligen Kritisch-/Patzer-Wurf zu warten"

key-files:
  created: []
  modified:
    - features/party/party-render.js
    - features/dice/dice-core.js
    - tests/e2e/features/design-fixes.spec.js
    - .planning/ROADMAP.md
    - .planning/phases/15-befundlage-vorlauf/deferred-items.md

key-decisions:
  - "Container-Klasse fuer die Zauberplatz-Anzeige: spell-slots-compact (nicht char-card-slots) — dashboard.css:1313 stylt bereits genau diese Klasse samt slot-pip/slot-pip.filled; char-card-slots/char-slot-pip/char-slot-label/char-slot-label haben in keiner Stylesheet-Datei eine Regel (nachgemessen per grep vor der Aenderung)"
  - "ROADMAP-Erfolgskriterium 4 auf .spell-slots-compact .slot-pip korrigiert (neue Entscheidung D-55) — ersetzt die von Plan 15-03 als D-15 gebuchte Vermutung .char-card-slots .slot-pip, die nur das damals ungeprueft gemessene, kaputte Markup beschrieb, nicht den tatsaechlich reparierten Zustand"
  - "getSpellSlots()/die initialisierende Hilfsfunktion aus spellslots-ui.js wird im neuen Renderer-Rumpf NICHT aufgerufen — sie mutiert ch.spellSlots als Seiteneffekt; stattdessen defensiver Lesezugriff mit slots[level] && slots[level].max (T-15-11-Mitigation)"
  - "Zaubertricks (Grad 0) werden als reiner Zaehler ohne data-action gerendert, exakt wie im Zielmuster systems/spellslots/spellslots-ui.js — ein eigener Testfall sichert data-action=toggle-spell-slot-stop][data-value=0] == 0 zu"
  - "GATE-05-Erfolgskriterium 5 (ROADMAP.md) beschreibt weiterhin die von PROJECT.md als ABGELEHNT dokumentierte reduzierte Drei-Stufen-Form (D-53) — als Out-of-Scope-Fund in deferred-items.md protokolliert statt in diesem Plan mitkorrigiert, weil der Orchestrator nur Kriterium 4 als Teil dieses Plans benannt hat"

requirements-completed: [FIX-02, FIX-03]

coverage:
  - id: D1
    description: "Kompakte Zauberplatz-Anzeige rendert sichtbare, klickbare Pips mit berechneter Breite > 0; Zaubertricks als Zaehler ohne Klickaktion"
    requirement: "FIX-02"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/design-fixes.spec.js#Zauberplatz-Pips sind sichtbar mit berechneter Breite groesser als null"
        status: pass
    human_judgment: false
  - id: D2
    description: "Klick auf einen gefuellten Zauberplatz-Pip senkt den Stand des zugehoerigen Grades im Datenobjekt ueber die korrekten data-id/data-value-Attribute"
    requirement: "FIX-02"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/design-fixes.spec.js#Klick auf einen gefuellten Zauberplatz-Pip senkt den Stand im Datenobjekt"
        status: pass
    human_judgment: false
  - id: D3
    description: "Der gesenkte Zauberplatz-Stand ueberlebt einen Neuladen der Seite (Persistenz ueber save())"
    requirement: "FIX-02"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/design-fixes.spec.js#Der gesenkte Zauberplatz-Stand ueberlebt einen Neuladen der Seite"
        status: pass
    human_judgment: false
  - id: D4
    description: "Wuerfelergebnis behaelt nach einem gewoehnlichen Wurf seine Formatierungsklasse (grosse Schrift, Goldton)"
    requirement: "FIX-03"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/design-fixes.spec.js#Nach einem gewoehnlichen Wurf behaelt die Ergebniszahl ihre Formatierungsklasse"
        status: pass
    human_judgment: false
  - id: D5
    description: "Kritisch-Faerbung landet auf der Ergebniszahl (nicht dem Container) und unterscheidet sich sichtbar vom Goldton; Container traegt keine Zustandsklasse mehr"
    requirement: "FIX-03"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/design-fixes.spec.js#Nach einem kritischen Wurf traegt die Ergebniszahl den Kritisch-Zustand mit abweichender Farbe"
        status: pass
      - kind: e2e
        ref: "tests/e2e/features/dice.spec.js (11/11 passed, unveraendert)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Patzer-Faerbung landet auf der Ergebniszahl und unterscheidet sich sowohl vom Goldton als auch von der Kritisch-Farbe"
    requirement: "FIX-03"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/design-fixes.spec.js#Nach einem Patzer traegt die Ergebniszahl den Patzer-Zustand mit einer dritten Farbe"
        status: pass
    human_judgment: false
  - id: D7
    description: "Vier-Themes-Sichtung der drei reparierten Stellen dieser Phase (Gelaende/Fertigkeiten/Wissensgebiete, Zauberplatz-Pips, Wuerfelfarbe) im gebauten Buendel"
    verification: []
    human_judgment: true
    rationale: "Visuelle Themen-Gegenprobe ist eine Sichtpruefung (Task 3 <human-check>); per workflow.human_verify_mode=end-of-phase (Default) wird sie von der Phasenverifikation gebuendelt in {phase}-UAT.md aufgenommen, nicht mid-flight ausgefuehrt (wie bereits in Plan 15-04 gehandhabt)."

# Metrics
duration: ~50min
completed: 2026-09-09
status: complete
---

# Phase 15 Plan 05: Zauberplatz-Pips und Wuerfelfarbe reparieren Summary

**Die kompakte Zauberplatz-Anzeige der Charakterkarte wechselt von einer immer-leeren Vergleichslogik gegen die falsche Datenform auf die kanonische `{max, current}`-Form mit handlerkompatiblen Attributen und bereits gestylten Klassen; das Wuerfelergebnis der Hauptansicht behaelt seine Formatierung, weil Kritisch-/Patzerzustand jetzt auf der Zahl selbst statt auf dem ungestylten Container landen — beide Reparaturen mit rot bewiesenem Playwright-Vorlauf.**

## Performance

- **Duration:** ~50 min (ungefaehr, keine exakte Startuhrzeit erfasst)
- **Completed:** 2026-09-09
- **Tasks:** 3
- **Files modified:** 5 (2 Quelldateien, 1 Testdatei, 2 Planungsdateien)

## Accomplishments

- `renderCompactSpellSlots()` in `features/party/party-render.js` liest jetzt `ch.spellSlots[level] = {max, current}` (die kanonische Form, wie sie `features/party/party-crud.js` schreibt und `systems/spellslots/spellslots-ui.js` liest) statt einen Platz als Zahl gegen `> 0` zu vergleichen — der alte Vergleich war strukturell immer falsch und lieferte ausnahmslos den leeren String
- Erzeugtes Markup traegt jetzt `data-id`/`data-value` statt der drei vorher gesetzten, von `ui/event-delegation.js` nie gelesenen Attribute (`data-char`/`data-level`/`data-index`) — ein Klick ruft `toggleSpellSlot()` jetzt mit gueltiger Kennung und gueltigem Grad auf, statt in dessen erster Wachzeile still abzubrechen
- Container-/Pip-Klassen umgestellt auf `spell-slots-compact`/`slot-pip`/`slot-pip filled` — bereits in `dashboard.css:1313-1338` gestylt; die vorherige `char-card-slots`/`char-slot-*`-Familie hatte in keiner Stylesheet-Datei eine Regel. Kein neues CSS (D-14)
- Renderer ruft die initialisierende Hilfsfunktion aus `spellslots-ui.js` NICHT auf (die mutiert `ch.spellSlots` als Seiteneffekt) — defensiver Lesezugriff stattdessen (T-15-11-Mitigation)
- Zaubertricks (Grad 0) rendern als reiner Zaehler ohne `data-action`, wie im Zielmuster
- `displayDiceResult()` in `features/dice/dice-core.js`: `heroResult.className` wird auf `'dice-hero-result'` gesetzt statt geleert, und die Zustandsklassen `crit`/`fail` werden auf `heroResult` (nicht mehr auf `heroContainer`) gesetzt und entfernt — `.dice-hero-result.crit`/`.dice-hero-result.fail` sind die einzigen existierenden Farbregeln, der Container hatte nie eine entsprechende Regel. Konfetti bleibt unveraendert am Container. Kein CSS geaendert
- Sechs neue Playwright-Faelle in `tests/e2e/features/design-fixes.spec.js` (drei FIX-02, drei FIX-03), namentlich siehe Ratschen-Beweis unten
- ROADMAP-Erfolgskriterium 4 auf den tatsaechlich implementierten Selektor `.spell-slots-compact .slot-pip` korrigiert (D-55, ersetzt die D-15-Vermutung aus Plan 15-03)

## Task Commits

Each task was committed atomically:

1. **Task 1: Zauberplatz-Anzeige — rot beweisen, dann auf die funktionierende Pip-Familie umstellen** - `99c7af5` (fix)
2. **Task 2: Wuerfelzahl — Formatierung erhalten, Zustandsklassen auf die Zahl legen** - `69496af` (fix)
3. **Task 3: Volle Kette, beide Builds, Vier-Themes-Sichtung** — kein eigener Code-Commit (Verifikations-/Dokumentations-Task); ROADMAP-Korrektur und `deferred-items.md` gehen in die Plan-Metadaten-Commit dieses Plans ein

**Plan metadata:** wird nach diesem SUMMARY committet (STATE.md/ROADMAP.md/REQUIREMENTS.md)

## Files Created/Modified

- `features/party/party-render.js` - `renderCompactSpellSlots()` vollstaendig ersetzt: kanonische Datenform, handlerkompatible Attribute, gestylte Klassen, kein Aufruf der mutierenden Hilfsfunktion
- `features/dice/dice-core.js` - `displayDiceResult()`: Formatierungsklasse bleibt erhalten, Zustandsklassen wandern vom Container auf die Ergebniszahl
- `tests/e2e/features/design-fixes.spec.js` - Zwei neue `describe`-Bloecke (FIX-02, FIX-03) mit je drei Testfaellen
- `.planning/ROADMAP.md` - Erfolgskriterium 4 (Phase 15) auf `.spell-slots-compact .slot-pip` korrigiert (D-55)
- `.planning/phases/15-befundlage-vorlauf/deferred-items.md` - Neu: Out-of-Scope-Fund zu ROADMAP-Erfolgskriterium 5 (GATE-05-Reduktion, siehe Decisions)

## Decisions Made

Siehe `key-decisions` im Frontmatter. Kernpunkt: der Selektor-Konflikt aus der Orchestrator-Vorgabe wurde durch direkte Messung geloest — `.spell-slots-compact`/`.slot-pip` sind die einzigen bereits gestylten Klassen fuer diese Komponente (`dashboard.css:1313-1338`); `.char-card-slots`/`.char-slot-pip` (Plan 15-03s Annahme) hatten nachweislich null CSS-Regeln. ROADMAP.md wurde entsprechend korrigiert (D-55), nicht die Annahme uebernommen.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Eigene Testkommentare loesten faelschlich die Modul-Test-Abdeckungs-Ratsche aus**
- **Found during:** Task 1 (nach dem ersten `npx jest`-Lauf nach der Zauberplatz-Reparatur)
- **Issue:** Die JSDoc-Kommentare der neuen Helper-Funktion in `design-fixes.spec.js` zitierten woertlich `features/party/party-crud.js:186` und `systems/spellslots/spellslots-ui.js:16` als Quellenangabe. `tests/unit/module-test-coverage.test.js` misst Modulabdeckung ueber woertliches Vorkommen des Modulpfads in einer beliebigen Datei unter `tests/` — beide Pfade stehen auf der `MODULE_TEST_EXCEPTIONS`-Liste (echte Testabdeckung fehlt), und die reine Kommentar-Erwaehnung liess den Ratschen-Testfall "kein Eintrag ist inzwischen abgedeckt" fehlschlagen (die Liste darf nur schrumpfen, keine Schein-Abdeckung durch Erwaehnung).
- **Fix:** Kommentar umformuliert, ohne die woertlichen Modulpfade zu zitieren ("wie die Charakterverwaltung sie schreibt" statt des Dateipfads).
- **Files modified:** tests/e2e/features/design-fixes.spec.js
- **Verification:** `npx jest` erneut gruen (1220/1220, `module-test-coverage.test.js` 4/4)
- **Committed in:** `99c7af5` (Teil des Task-1-Commits, vor dem eigentlichen Commit korrigiert)

---

**Total deviations:** 1 auto-fixed (Rule 1 — Bug in den eigenen Testkommentaren, keine Fremd-Datei betroffen).
**Impact on plan:** Rein redaktionell, keine Aenderung an Testverhalten oder Produktionscode. Kein Scope Creep.

## Issues Encountered

Ein methodischer Stolperstein (nicht am Ergebnis): zwei Playwright-Zwischenlaeufe wurden versehentlich mit `2>&1 | tail -N` durchgefuehrt, bevor `echo "EXIT_CODE=$?"` folgte — dadurch spiegelte der geloggte Exit-Code den von `tail` (immer 0), nicht den von `playwright test`. Der Text-Output des Reporters (explizite Zahl bestandener/fehlgeschlagener Faelle, keine `x`-Zeilen) war in beiden Faellen eindeutig, wurde aber zur Absicherung durch je einen sauberen Nachlauf ohne Pipe-Interferenz ersetzt (siehe Ratschen-Beweis: die dort gelisteten Exit-Codes stammen alle aus ungepipten Laeufen oder aus dem allerersten, unverfaelschten RED-Lauf).

## User Setup Required

None - keine externe Service-Konfiguration noetig.

## Ratschen-Beweis (D-49)

**RED-Vorlauf, VOR jeder Code-Aenderung (beide Fixes betroffen, sechs neue Faelle gleichzeitig angelegt):**

```
npx playwright test tests/e2e/features/design-fixes.spec.js --reporter=list
6 failed (3× FIX-02, 3× FIX-03), 3 passed (FIX-01 unveraendert)
Exit-Code 1
```

Fehlerursachen bestaetigen den Defekt: FIX-02 — `count` von `.spell-slots-compact .slot-pip` ist `0` (Zauberplatz-Container wird nie erzeugt), die beiden klickbasierten Faelle laufen in ein 30s-Timeout (kein Pip zum Klicken vorhanden). FIX-03 — `style.fontSize` ist `16` statt `> 40` (Formatierungsklasse geloescht), Kritisch-/Patzerfarbe sind identisch mit der Normalfarbe (Zustandsklasse landet am ungestylten Container).

**Task 1 — GREEN nach der Zauberplatz-Reparatur (FIX-03 erwartungsgemaess weiterhin rot, Task 2 noch nicht begonnen):**

```
npx playwright test tests/e2e/features/design-fixes.spec.js --reporter=list
6 passed (FIX-01 + FIX-02), 3 failed (FIX-03)
Exit-Code 1
```

```
grep -c "spell-slots-compact" features/party/party-render.js   -> 1
grep -c "char-slot-pip" features/party/party-render.js         -> 0
grep -c "data-char=" features/party/party-render.js            -> 0
grep -c "getSpellSlots" features/party/party-render.js         -> 0
npx jest                                                        -> 1220/1220 passed, Exit-Code 0
```

**Task 2 — GREEN nach der Wuerfel-Reparatur (alle neun Faelle, sauberer Lauf ohne Pipe-Interferenz):**

```
npx playwright test tests/e2e/features/design-fixes.spec.js --reporter=list
9 passed
Exit-Code 0

npx playwright test tests/e2e/features/dice.spec.js --reporter=list
11 passed (unveraendert)
Exit-Code 0
```

```
grep -c "heroResult.className = 'dice-hero-result'" features/dice/dice-core.js  -> 1
grep -c "heroResult.classList.add('crit')" features/dice/dice-core.js           -> 1
grep -c "heroResult.classList.add('fail')" features/dice/dice-core.js           -> 1
grep -c "heroContainer.classList.add" features/dice/dice-core.js                -> 0
grep -c "createConfetti(heroContainer)" features/dice/dice-core.js              -> 1
git diff --stat assets/styles/dice.css                                          -> keine Aenderung
npx jest                                                                        -> 1220/1220 passed, Exit-Code 0
```

**Neue Testfaelle, namentlich (sechs, wie im Plan-Output gefordert):**

1. FIX-02: "Zauberplatz-Pips sind sichtbar mit berechneter Breite groesser als null"
2. FIX-02: "Klick auf einen gefuellten Zauberplatz-Pip senkt den Stand im Datenobjekt"
3. FIX-02: "Der gesenkte Zauberplatz-Stand ueberlebt einen Neuladen der Seite"
4. FIX-03: "Nach einem gewoehnlichen Wurf behaelt die Ergebniszahl ihre Formatierungsklasse"
5. FIX-03: "Nach einem kritischen Wurf traegt die Ergebniszahl den Kritisch-Zustand mit abweichender Farbe"
6. FIX-03: "Nach einem Patzer traegt die Ergebniszahl den Patzer-Zustand mit einer dritten Farbe"

## Volle Kette (Task 3) — Ausgangswert vs. Endwert

Ausgangswert = letzter vollstaendiger Lauf vor diesem Plan (`15-04-SUMMARY.md` § "Volle Suiten").

| Suite | Ausgangswert (nach 15-04) | Endwert (nach 15-05) | Differenz | Herkunft der Differenz |
|-------|---------------------------|-----------------------|-----------|------------------------|
| `npx jest` | 1220/1220 (53 Suiten, 50 Snapshots) | 1220/1220 (53 Suiten, 50 Snapshots) | 0 | Keine neuen Unit-Tests — beide Fixes werden ausschliesslich per Playwright abgenommen |
| `npx jest tests/unit/design-consistency.test.js` | 67/67 | 67/67 | 0 | Keine CSS-Datei in diesem Plan geaendert |
| `npx playwright test` | 357 gesamt (355 passed / 2 skipped) | 363 gesamt (361 passed / 2 skipped) | +6 passed, 0 failed | Sechs neue Faelle in `design-fixes.spec.js` (namentlich siehe oben) |
| `python -m pytest tests/build -q` | 24/24 | 24/24 | 0 | Kein Build-Skript geaendert |
| `python build.py` | SUCCESS | SUCCESS | — | — |
| `python build.py --production` | SUCCESS | SUCCESS | — | — |

Alle vier automatisierten `<verify>`-Zeilen der plan-weiten `<verification>` sind damit erfuellt: `design-fixes.spec.js` gruen mit neun statt sechs Faellen (mindestens sechs gefordert), `dice.spec.js` unveraendert gruen, `npx jest` ohne fehlgeschlagene Tests, `pytest tests/build` gruen, beide Builds laufen durch, alte Pip-Klassenfamilie und alte Attributnamen kommen in `party-render.js` nicht mehr vor, `dice.css` unveraendert.

**Vier-Themes-Sichtung (Task 3 `<human-check>`):** wie bereits in Plan 15-04 gehandhabt, per `workflow.human_verify_mode=end-of-phase` (Default) fuer die gebuendelte Phasen-UAT vorgemerkt, nicht mid-flight in diesem Plan ausgefuehrt. Der Mindestumfang fuer die volle Runde nach Phase 15 (GATE-05) umfasst nach diesem Plan: DM-Screen-Referenzwidgets (15-04), Zauberplatz-Pips (dieser Plan), Wuerfelergebnis inkl. Crit/Fumble-Faerbung (dieser Plan).

## Next Phase Readiness

- Alle drei sichtbaren Design-Defekte dieser Phase (FIX-01/FIX-02/FIX-03) sind jetzt automatisiert abgenommen in `tests/e2e/features/design-fixes.spec.js` (9 Faelle gesamt)
- `.planning/phases/15-befundlage-vorlauf/deferred-items.md` haelt einen Out-of-Scope-Fund fest (ROADMAP-Erfolgskriterium 5 vs. PROJECT.md § GATE-05) fuer einen der verbleibenden Plaene (15-06/15-07/15-08) oder `/gsd-verify-work 15`
- Volle Suiten gruen: Jest 1220/1220, Playwright 361 passed/2 skipped, `pytest tests/build` 24/24, beide Builds erfolgreich

## Self-Check: PASSED

- FOUND: features/party/party-render.js (spell-slots-compact vorhanden, char-slot-pip/data-char= abwesend)
- FOUND: features/dice/dice-core.js (heroResult.className = 'dice-hero-result', heroResult.classList.add('crit'/'fail') vorhanden, heroContainer.classList.add abwesend)
- FOUND: tests/e2e/features/design-fixes.spec.js (neun Testfaelle, FIX-02/FIX-03-describe-Bloecke vorhanden)
- FOUND: .planning/ROADMAP.md (.spell-slots-compact .slot-pip in Erfolgskriterium 4)
- FOUND: .planning/phases/15-befundlage-vorlauf/deferred-items.md
- FOUND: commit 99c7af5 in `git log --oneline --all`
- FOUND: commit 69496af in `git log --oneline --all`
- All plan-level `<verification>` commands re-run and green (siehe Ratschen-Beweis und Volle Kette oben)

---
*Phase: 15-befundlage-vorlauf*
*Completed: 2026-09-09*
