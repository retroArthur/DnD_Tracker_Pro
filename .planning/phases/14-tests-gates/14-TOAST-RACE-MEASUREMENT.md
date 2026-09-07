# Toast-Race Messprotokoll — `locations.spec.js` / `encounters.spec.js`

Folgt der Form von `.planning/phases/13-h-rtung-wartbarkeit/13-PERF-MEASUREMENT.md`:
Messprotokoll als Artefakt, nicht als Behauptung im Summary (D-02).

## Vorlauf — ungefixter Stand (Task 1)

- **Datum:** 2026-09-07
- **Commit (ungefixter Stand):** `d384e2e` (docs(14-02): complete ESLint-Globals-Generator plan)
- **Bundle:** `PYTHONIOENCODING=utf-8 python build.py` — erfolgreich, kein `[FEHLER]`/`[ABORTED]`
- **Verfahren:** Laststufenleiter, Abbruch bei erster roter Stufe. Alle Befehle mit `--retries=0`.

### Stufe 1 — `--repeat-each=5 --workers=4`

**Befehl:**
```
npx playwright test tests/e2e/crud/locations.spec.js tests/e2e/crud/encounters.spec.js --retries=0 --repeat-each=5 --workers=4 --reporter=json,list
```
(mit `PLAYWRIGHT_JSON_OUTPUT_NAME=stage1.json` für den maschinenlesbaren Beleg)

**Playwright-Zusammenfassung:**
```
5 failed
  [chromium] › tests\e2e\crud\encounters.spec.js:103:5 › Encounters - CRUD Operationen › CREATE - Encounter erstellen › Monster ohne Namen zeigt Fehlermeldung
  [chromium] › tests\e2e\crud\encounters.spec.js:103:5 › Encounters - CRUD Operationen › CREATE - Encounter erstellen › Monster ohne Namen zeigt Fehlermeldung
  [chromium] › tests\e2e\crud\encounters.spec.js:103:5 › Encounters - CRUD Operationen › CREATE - Encounter erstellen › Monster ohne Namen zeigt Fehlermeldung
  [chromium] › tests\e2e\crud\encounters.spec.js:103:5 › Encounters - CRUD Operationen › CREATE - Encounter erstellen › Monster ohne Namen zeigt Fehlermeldung
  [chromium] › tests\e2e\crud\encounters.spec.js:103:5 › Encounters - CRUD Operationen › CREATE - Encounter erstellen › Monster ohne Namen zeigt Fehlermeldung
90 passed (1.6m)
```

JSON-Stats: `{"expected":90,"skipped":0,"unexpected":5,"flaky":0}` (93,5s Laufzeit).

**Fehlerauszug (repräsentativ, alle 5 Fehlschläge identisch in Ursache und Fundstelle):**
```
5) [chromium] › tests\e2e\crud\encounters.spec.js:103:5 › Encounters - CRUD Operationen › CREATE - Encounter erstellen › Monster ohne Namen zeigt Fehlermeldung

  Error: expect(locator).toBeVisible() failed

  Locator:  locator('#toast')
  Expected: visible
  Received: hidden
  Timeout:  5000ms

  Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for locator('#toast')
      9 × locator resolved to <div id="toast" class="toast error">⚠️ Name erforderlich</div>
        - unexpected value "hidden"

    130 |             // Toast sollte Fehler zeigen
    131 |             const toast = page.locator('#toast');
  > 132 |             await expect(toast).toBeVisible();
        |                                 ^
    133 |         });
    134 |     });
    135 |
    at D:\Claude_Code\Projekte\DnD_Tracker_App_Pro\tests\e2e\crud\encounters.spec.js:132:33
```

Die Fehlermeldung nennt `encounters.spec.js:132` — genau die in `must_haves.key_links` benannte
Assertion. Der Toast wird sichtbar gesetzt (`#toast.error` mit dem korrekten Text ist im DOM), aber
zwischen dem Setzen und der `expect`-Prüfung fällt er wieder auf `hidden` zurück — die
beschriebene Toast-Race: ein zweiter, fruehzeitiger `save()`-getriebener Toast (aus
`initRandomTables()`/`validateDataIntegrity()`, siehe 08-RESEARCH Pitfall 4) ueberschreibt und
verbirgt den geteilten `#toast`-Knoten wieder, bevor die Testassertion ihn sieht.

**Beweisparameter: `--repeat-each=5 --workers=4` (Stufe 1).** Bereits die erste, niedrigste
Laststufe ist rot — eine höhere Stufe war nicht nötig, um den Defekt nachzuweisen. Task 3
wiederholt exakt diese Parameter gegen den gefixten Stand.

**Kontrolle — keine Testcode-/Config-Änderung in diesem Task:**
```
git diff --quiet -- tests/e2e playwright.config.js
```
→ Exit 0 (keine Änderung).

## Nachlauf — gefixter Stand (Task 3)

- **Datum:** 2026-09-07
- **Commit (gefixter Stand):** `83815cb` (fix(14-03): seedCleanSession(page) extrahieren und in fuenf CRUD-Specs verdrahten)
- **Bundle:** `PYTHONIOENCODING=utf-8 python build.py` — erfolgreich, kein `[FEHLER]`/`[ABORTED]`
- **Parameter:** identisch zum Beweisparameter aus dem Vorlauf — `tests/e2e/crud/locations.spec.js
  tests/e2e/crud/encounters.spec.js --retries=0 --repeat-each=5 --workers=4`. Nichts nachjustiert.

**Befehl (beide Laeufe wortgleich):**
```
npx playwright test tests/e2e/crud/locations.spec.js tests/e2e/crud/encounters.spec.js --retries=0 --repeat-each=5 --workers=4 --reporter=json,list
```

### Nachlauf 1

**Playwright-Zusammenfassung:**
```
95 passed (1.4m)
```
JSON-Stats: `{"expected":95,"skipped":0,"unexpected":0,"flaky":0}` (85,8s Laufzeit).

### Nachlauf 2

**Playwright-Zusammenfassung:**
```
95 passed (1.4m)
```
JSON-Stats: `{"expected":95,"skipped":0,"unexpected":0,"flaky":0}` (85,5s Laufzeit).

Beide Nachlaeufe sind vollstaendig gruen — kein einziger Fehlschlag, kein `flaky`.

## Vergleichstabelle

| Laststufe | Stand | Ergebnis | Tests gesamt | Fehlschlaege |
| --- | --- | --- | --- | --- |
| `--repeat-each=5 --workers=4` | ungefixt (`d384e2e`) | ROT | 95 | 5 |
| `--repeat-each=5 --workers=4` | gefixt, Nachlauf 1 (`83815cb`) | GRUEN | 95 | 0 |
| `--repeat-each=5 --workers=4` | gefixt, Nachlauf 2 (`83815cb`) | GRUEN | 95 | 0 |

## Interpretation

Der Vorlauf gegen den ungefixten Stand war **rot** (5 von 95 Tests fehlgeschlagen, alle an
`encounters.spec.js:132`, Toast faellt zwischen Setzen und Assertion auf `hidden` zurueck — die
in `08-RESEARCH.md` Pitfall 4 beschriebene Race durch fruehzeitige `save()`-Aufrufe aus
`initRandomTables()`/`validateDataIntegrity()`). Nach der Extraktion von `seedCleanSession(page)`
und ihrer Verdrahtung in `locations.spec.js` und `encounters.spec.js` sind **zwei unabhaengige
Nachlaeufe mit identischen Parametern** (gleiche Dateien, `--repeat-each=5`, `--workers=4`, beide
`--retries=0`) vollstaendig **gruen** — ein einzelner gluecklicher Lauf zaehlt nicht als Beweis,
deshalb zwei. Die einzige Variable zwischen Vor- und Nachlauf ist der Fix selbst; die
Lastparameter, die Testauswahl und `--retries=0` blieben identisch. `playwright.config.js` ist
dabei in keinem der drei Laeufe angefasst worden — `retries: process.env.CI ? 2 : 0` steht
unveraendert (D-03); der gesamte Beweis lief per Kommandozeilen-Override, nicht durch eine
Aenderung der CI-Konfiguration.

## Abschliessende Regressionspruefung

Nach der Extraktion einmal die volle Suite gefahren, um auszuschliessen, dass das Verschieben
des Seeds anderswo etwas verschoben hat:

```
npx playwright test
```
→ **321 passed, 2 skipped** (keine kleinere Zahl als der in `STATE.md` protokollierte
Ausgangswert nach Phase 13: 321 passed / 2 skipped).

```
npx jest
```
→ **44 Suiten, 1112 Tests, alle bestanden** (unveraendert gegenueber dem Ausgangswert nach
14-01/14-02).

