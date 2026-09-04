---
phase: 12-datensicherheit
plan: 10
subsystem: file-backup
tags: [file-backup, jest, vm-context, tdd, gap-closure, cr-02]

# Dependency graph
requires:
  - phase: 12-datensicherheit (Plan 03)
    provides: die Multi-Kampagnen-Iteration in _doBackup() (D-03) und resolveBackupTargets()
provides:
  - "CR-02 geschlossen: readCampaignDataForBackup() Stufe 3 liefert window.D nur noch, wenn campaignKey mit dem aktiven Key (window.STORAGE_KEY_OVERRIDE || APP_CONFIG.STORAGE_KEY) uebereinstimmt"
  - "createDoBackupContext()-Testhelfer kann jetzt ctx.window.D und ctx.window.STORAGE_KEY_OVERRIDE setzen — Stufe 3 ist damit zum ersten Mal ueberhaupt von einem Test erreichbar"
  - "createMockDirHandle() faengt den tatsaechlich geschriebenen Backup-Inhalt ab (nicht nur Dateinamen) — Grundlage fuer Kennmarken-/Inhaltspruefungen"
  - "Invariantentest ueber alle Ziele eines _doBackup()-Laufs, bezogen aus dem echten resolveBackupTargets()"
affects: [12-11]

# Actuals (#2632)
actuals:
  tokens: 3400
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Testhelfer-Erweiterung mit optionalen, unbelegten Parametern (dImSpeicher/aktiverKey) statt neuer Helferfunktion — bestehende Aufrufer bleiben Byte-fuer-Byte unveraendert, solange sie die neuen Parameter nicht uebergeben"
    - "Mock-Dateisystem faengt den tatsaechlich geschriebenen JSON-String ab (statt nur `true`), damit Content-Assertions moeglich werden, ohne die Semantik von .has()/.size fuer bestehende Tests zu aendern"
    - "Invarianten-Tests beziehen die Dateiname-zu-Key-Zuordnung aus der ECHTEN Produktionsfunktion (ctx.resolveBackupTargets()) statt aus einer im Test abgetippten Liste — verhindert Test-Production-Drift"

key-files:
  created: []
  modified:
    - systems/file-backup/file-backup-manager.js
    - tests/unit/file-backup.test.js

key-decisions:
  - "promote (aus <assumption_delta_decision> des Plans, wortgetreu uebernommen): der angefragte campaignKey wird primaer; window.D wird zum Detail genau einer Variante degradiert — der aktiven Kampagne — und ist nur noch erreichbar, wenn campaignKey === (window.STORAGE_KEY_OVERRIDE || APP_CONFIG.STORAGE_KEY). Kein add-alongside, kein zweiter Codepfad — die bestehende Stufe 3 bekommt ihren fehlenden Waechter."
  - "Test-Design-Abweichung (Rule 1, siehe Deviations): das im Plan skizzierte Test-F-Setup (eine einzelne, aktive benannte Kampagne als 'Standard-Kampagne'-Opfer) kollidiert strukturell mit resolveBackupTargets()s Dedup-Logik — das Pseudo-Ziel 'Standard-Kampagne' erhaelt IMMER denselben Key wie der aktive Schluessel und kann folglich nie selbst das Opfer der Fehlzuordnung sein. Umgesetzt mit vertauschten Rollen (Standard-Kampagne aktiv, eine SEPARATE indizierte Kampagne ist das nie gespeicherte Opfer) — beweist denselben Fehler, mechanisch korrekt."

requirements-completed: [SAFE-02]

coverage:
  - id: D1
    description: "Eine im Index eingetragene, nie gespeicherte Kampagne erzeugt keine Backup-Datei, auch wenn eine andere Kampagne befuellt im Speicher aktiv ist"
    requirement: "SAFE-02"
    verification:
      - kind: unit
        ref: "tests/unit/file-backup.test.js#_doBackup() — CR-02: eine im Index eingetragene, nie gespeicherte Kampagne bekommt kein Backup, obwohl eine andere Kampagne befuellt im Speicher aktiv ist"
        status: pass
    human_judgment: false
  - id: D2
    description: "Keine geschriebene Backup-Datei traegt die Kennmarke einer fremden Kampagne"
    requirement: "SAFE-02"
    verification:
      - kind: unit
        ref: "tests/unit/file-backup.test.js#_doBackup() — CR-02: entstuende die Backup-Datei einer nie gespeicherten Kampagne doch, truege sie nicht die Kennmarke der aktiven Kampagne"
        status: pass
    human_judgment: false
  - id: D3
    description: "Die aktive Kampagne bekommt ihr Backup auch dann, wenn sie nur im laufenden Speicher steht"
    requirement: "SAFE-02"
    verification:
      - kind: unit
        ref: "tests/unit/file-backup.test.js#_doBackup() — CR-02: die aktive Kampagne bekommt ihr Backup auch dann, wenn sie nur im laufenden Speicher steht"
        status: pass
    human_judgment: false
  - id: D4
    description: "Invariante ueber alle Ziele eines _doBackup()-Laufs: jede Datei traegt die Kennmarke ihres eigenen Keys, bezogen aus resolveBackupTargets()"
    requirement: "SAFE-02"
    verification:
      - kind: unit
        ref: "tests/unit/file-backup.test.js#_doBackup() — CR-02 Invariante: jede geschriebene Backup-Datei traegt die Kennmarke des eigenen Ziel-Keys — ueber alle Ziele eines Laufs"
        status: pass
    human_judgment: false
  - id: D5
    description: "Mutationsnachweis: bei entferntem Waechter fallen benannte Tests um"
    requirement: "SAFE-02"
    verification:
      - kind: unit
        ref: "tests/unit/file-backup.test.js#_doBackup() — CR-02 Test F + CR-02 Test G (Mutation: Stufe-3-Waechter testweise entfernt); zusaetzlich CR-02 Invariante (Mutation: Kennmarke testweise vertauscht)"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-09-04
status: complete
---

# Phase 12 Plan 10: CR-02 (Fremdzuordnung im Datei-Backup) Summary

**`readCampaignDataForBackup()`s Stufe-3-Fallback gibt `window.D` nur noch fuer die tatsaechlich angefragte, aktive Kampagne zurueck — statt bislang fuer jede beliebige.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-09-04
- **Completed:** 2026-09-04
- **Tasks:** 3
- **Files modified:** 2 (`systems/file-backup/file-backup-manager.js`, `tests/unit/file-backup.test.js`)

## Accomplishments

- CR-02 geschlossen (`12-VERIFICATION.md` `gaps[1]`, Truth 8 FAILED): `readCampaignDataForBackup()`s dritte Stufe (`window.D`-Fallback) prueft jetzt `campaignKey === (window.STORAGE_KEY_OVERRIDE || window.APP_CONFIG?.STORAGE_KEY)`, bevor sie `window.D` zurueckgibt. Eine im Index eingetragene, aber nie gespeicherte Kampagne bekommt keine Backup-Datei mehr mit den Daten einer anderen (aktiven) Kampagne befuellt — der DEBT-17-Schutz `if (!data) continue` in `_doBackup()` greift stattdessen (wortgleich unveraendert, aber jetzt wieder wirksam).
- Kein ermittelbarer aktiver Key (kein `window`, kein `APP_CONFIG`) → Stufe 3 greift nicht — die sichere Richtung (lieber kein Backup als eines mit fremden Daten).
- Testloch geschlossen: `createDoBackupContext()` kann jetzt `ctx.window.D` (Parameter `dImSpeicher`) und `ctx.window.STORAGE_KEY_OVERRIDE` (Parameter `aktiverKey`) setzen — Stufe 3 war zuvor in ALLEN 17 bestehenden Tests toter Code, weil kein Test je ein `ctx.D` setzte. Ohne beide Parameter verhaelt sich der Helfer exakt wie bisher (durch den Rot-Lauf und den anschliessenden Gruen-Lauf der vier bestehenden `_doBackup()`-Tests bestaetigt).
- `createMockDirHandle()` faengt jetzt den tatsaechlich geschriebenen JSON-Inhalt ab (vorher nur `true`) — Grundlage fuer die neuen Kennmarken-Pruefungen, ohne bestehende `.has()`/`.size`-Assertionen zu beruehren.
- Invariantentest (Task 3) haelt die `promote`-Entscheidung aus `<assumption_delta_decision>` als Regressionstest fest: fuer JEDES von `resolveBackupTargets()` gelieferte Ziel stammt die geschriebene Kennmarke aus dem eigenen Key dieses Ziels — nie aus dem eines anderen. Die Datei-zu-Key-Zuordnung wird aus der ECHTEN Produktionsfunktion bezogen, nicht aus einer abgetippten Liste.
- Testzahl der Datei: 17 → 21 (+4: zwei rote Durchstich-Tests, eine Gegenprobe, eine Invariante).

## Task Commits

Jeder Task ist einzeln committet; das Plan folgt insgesamt dem RED-GREEN-Muster (kein separates REFACTOR noetig):

1. **Task 1: Roter Durchstich** — `1591ce3` (test) — Testhelfer erweitert, zwei neue CR-02-Tests rot, vier bestehende `_doBackup()`-Tests unveraendert gruen
2. **Task 2: Der Fix** — `475908e` (fix) — Stufe-3-Waechter gesetzt + JSDoc nachgezogen + Gegenprobe-Test (Test H) hinzugefuegt, Mutationsnachweis protokolliert
3. **Task 3: Die Invariante** — `2752e07` (test) — Invariantentest ueber alle Ziele, Rot-Nachweis per absichtlich vertauschter Kennmarke protokolliert

**Plan metadata:** (folgt in diesem Commit)

## Files Created/Modified

- `systems/file-backup/file-backup-manager.js` — `readCampaignDataForBackup()` Stufe 3: neuer Waechter (`aktiverBackupKey`-Vergleich), JSDoc-Block ueber der Funktion nachgezogen. Keine neue Top-Level-Deklaration, keine neuen `window.*`-Exports.
- `tests/unit/file-backup.test.js` — `createDoBackupContext()` um zwei optionale Parameter (`dImSpeicher`, `aktiverKey`) erweitert; `createMockDirHandle()`s `write`-Mock faengt jetzt den Inhalt ab; vier neue Tests im bestehenden `describe('_doBackup() — alle Kampagnen des Index, fehlerisoliert je Kampagne (D-03)')`-Block (CR-02 Test F, Test G, Test H, Invariante).

## Decisions Made

- **`promote`** (aus `<assumption_delta_decision>` des Plans, wortgetreu umgesetzt): der angefragte `campaignKey` ist jetzt primaer; `window.D` ist nur noch Detail genau einer Variante — der aktiven Kampagne. Kein zweiter Codepfad neben dem alten (`add-alongside` waere falsch gewesen) — die bestehende Stufe 3 bekam ihren fehlenden Waechter.
- **Begleitende Invariante** (aus demselben Block, als Task 3 eingeplant): fuer jedes Ziel, das `resolveBackupTargets()` liefert, stammen die geschriebenen Daten aus dem eigenen Key dieses Ziels — nie aus dem einer anderen Kampagne. Als Regressionstest verankert; faellt rot, sollte eine kuenftige Phase die singulaere Annahme wieder einfuehren.
- **Test-Design-Abweichung** (Rule 1 — siehe Deviations unten): das im Plan skizzierte Test-F-Setup musste mechanisch angepasst werden, um den Fehler tatsaechlich zu reproduzieren.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test-Design-Fehler] Test-F/G-Szenario aus dem Plan reproduziert den Fehler nicht wie beschrieben; mechanisch korrektes Aequivalent implementiert**

- **Found during:** Task 1 (Roter Durchstich)
- **Issue:** Der Plan skizziert Test F als "eine einzelne, aktive, benannte Kampagne (`dnd-campaign-1`, „Kampagne A") mit `aktiverKey = 'dnd-campaign-1'`, waehrend die literale Standard-Kampagne (`dnd-tracker-data`) das Opfer ist". Bei genauer Nachverfolgung des Produktionscodes zeigt sich: `_doBackup()` berechnet seinen `storageKey` (den es an `resolveBackupTargets()` uebergibt UND als Key des unbedingten `'Standard-Kampagne'`-Pseudo-Ziels verwendet) aus **derselben** Formel (`window.STORAGE_KEY_OVERRIDE || window.APP_CONFIG.STORAGE_KEY`), die der Fix in Stufe 3 fuer den Aktiv-Vergleich benutzt. Setzt man `aktiverKey = 'dnd-campaign-1'` (wie im Plan-Text beschrieben), erhaelt das "Standard-Kampagne"-Pseudo-Ziel automatisch denselben Key wie der bereits im Index stehende Eintrag `dnd-campaign-1` — `resolveBackupTargets()`s Dedup-Logik (`seen.has(c.key)`) entfernt daraufhin den Index-Eintrag, und es bleibt genau EIN Ziel mit Key `dnd-campaign-1` uebrig, dessen eigene Daten (laut Plan "unter ihrem Key lesbar") bereits ueber Stufe 1 (localStorage) korrekt gefunden werden — Stufe 3 wird nie erreicht, der Fehler nie reproduziert (weder vor noch nach dem Fix). Das "Standard-Kampagne"-Pseudo-Ziel kann sein eigenes Opfer strukturell nie sein, weil sein Key per Konstruktion immer gleich dem Aktiv-Key ist.
- **Fix:** Rollen mechanisch vertauscht, ohne die Kernaussage zu aendern: die literale Standard-Kampagne bleibt aktiv (kein `aktiverKey` gesetzt → aktiver Key = `APP_CONFIG.STORAGE_KEY`), ihre einzige Datenquelle ist `window.D` (`dImSpeicher`); eine SEPARATE, im Index eingetragene, nie gespeicherte Kampagne (`dnd-campaign-1`, "Kampagne A") ist das Opfer. Dieses Setup umgeht den Dedup-Effekt (unterschiedliche Keys) und demonstriert exakt denselben Fehler — belegt durch den protokollierten Rot-Lauf unten, der ohne diese Anpassung nicht rot geworden waere. Die generische Beschreibung in `<artifacts_produced>` des Plans ("Eine im Index eingetragene, nie gespeicherte Kampagne...", "...obwohl eine andere Kampagne befuellt im Speicher aktiv ist") bleibt wortgleich erfuellt; nur die konkrete Rollenzuordnung (welche Kampagne konkret Opfer/aktiv ist) wich vom illustrativen Plan-Text ab.
- **Files modified:** `tests/unit/file-backup.test.js` (Test F, Test G, Test H, Invariante — alle vier nutzen dieselbe mechanisch korrekte Musterung)
- **Verification:** Rot-Lauf (unten protokolliert) zeigt den Fehler tatsaechlich; Mutationsnachweis (unten) bestaetigt, dass der Fix genau diese Tests absichert; Test H (Gegenprobe, `aktiverKey` gesetzt) zeigt separat, dass die dadurch entstehende Dedup-Kollision (Pseudo-Ziel `key === aktiverKey`) korrekt weiterhin ihr Backup bekommt — kein stiller Totalausfall.
- **Committed in:** `1591ce3` (Test F/G), `475908e` (Test H), `2752e07` (Invariante)

---

**Total deviations:** 1 auto-fixed (1 Test-Design-Fehler, Rule 1)
**Impact on plan:** Die Kernaussage jedes Tests (Beschreibung in `<artifacts_produced>`) ist unveraendert erfuellt; nur die konkrete Testkonstruktion musste an eine Eigenschaft von `resolveBackupTargets()` angepasst werden, die der Plan nicht bedacht hatte (Dedup zwischen dem unbedingten Standard-Kampagne-Pseudo-Ziel und einem Index-Eintrag mit demselben Key). Kein Produktionscode-Scope betroffen — `resolveBackupTargets()` bleibt wortgleich unangetastet, wie im `<scope_fence>` gefordert.

## Protokollierter Rot-Lauf (Task 1, Schritt 3)

Kommando: `npx jest tests/unit/file-backup.test.js -t "CR-02"`

```
● _doBackup() — alle Kampagnen des Index, fehlerisoliert je Kampagne (D-03) › CR-02: eine im Index eingetragene, nie gespeicherte Kampagne bekommt kein Backup, obwohl eine andere Kampagne befuellt im Speicher aktiv ist
  expect(received).toBe(expected) // Object.is equality
  Expected: false
  Received: true

● _doBackup() — alle Kampagnen des Index, fehlerisoliert je Kampagne (D-03) › CR-02: entstuende die Backup-Datei einer nie gespeicherten Kampagne doch, truege sie nicht die Kennmarke der aktiven Kampagne
  expect(received).not.toContain(expected) // indexOf
  Expected substring: not "marke-aktive-kampagne"
  Received string: "{ \"characters\": [ { \"id\": \"marke-aktive-kampagne\" } ] }"

Tests: 2 failed, 17 skipped, 19 total
```

Zweites Verify-Kommando (`-t "alle Kampagnen des Index"`): die vier bestehenden `_doBackup()`-Tests bestehen weiterhin (`√`), nur die beiden neuen CR-02-Tests sind rot — `Tests: 2 failed, 13 skipped, 4 passed, 19 total`.

## Mutationsnachweis (Task 2, Schritt 5)

Waechter (`aktiverBackupKey`-Vergleich) testweise entfernt, Stufe 3 wieder unbedingt gemacht (`if (typeof window !== 'undefined' && istBefuellt(window.D)) return window.D;`), volle Suite erneut gelaufen:

```
Tests: 2 failed, 18 passed, 20 total
```

Genau Test F und Test G fallen um (dieselben zwei Fehlermeldungen wie im Rot-Lauf); alle anderen 18 Tests — inklusive des in Task 2 neu hinzugefuegten Test H (Gegenprobe) — bleiben gruen, weil Test H den Fall `campaignKey === aktiverKey` prueft, der auch ohne Waechter korrekt ist. Waechter zurueckgenommen, Suite wieder `20 passed, 20 total`.

## Rot-Nachweis der Invariante (Task 3, Schritt "Rot sehen")

Kennmarke fuer `dnd-campaign-2` testweise auf `'MUTATION-TEST-VERTAUSCHT'` gesetzt (Erwartungswert im Test manipuliert, nicht der Produktionscode):

```
● _doBackup() — alle Kampagnen des Index, fehlerisoliert je Kampagne (D-03) › CR-02 Invariante: ...
  expect(received).toEqual(expected) // deep equality
  - Array []
  + Array [
  +   "kampagne-b-aktuell.json (Key dnd-campaign-2) traegt nicht die eigene Kennmarke MUTATION-TEST-VERTAUSCHT",
  + ]
Tests: 1 failed, 20 skipped, 21 total
```

Die Schleife sammelt und meldet den konkreten Verstoss (Dateiname + Key), nicht nur "irgendetwas stimmt nicht". Zuruckgenommen, Suite wieder `21 passed, 21 total`.

## Gemessene Testzahl gegen Baseline

- Baseline (2026-09-04, vor diesem Plan, gemessen): **17 passed**
- Nach Task 1 (roter Durchstich, Testhelfer + Test F/G): 2 failed, 17 passed (erwartet rot)
- Nach Task 2 (Fix + Test H): **20 passed** (17 + 3 neue: Test F, G, H)
- Nach Task 3 (Invariante): **21 passed** (20 + 1 neue) — erfuellt die Mindestanforderung aus der Plan-`<verification>` (mindestens 21 bestandene Tests)

`node --check systems/file-backup/file-backup-manager.js`: kein Befund (nach Task 2 und erneut nach Zuruecknehmen der Mutation geprueft).

## Assumption-Delta-Entscheidung (aus dem Plan, wortgetreu uebernommen)

**Primäres Substantiv:** `campaignKey` — die ANGEFRAGTE Kampagne, nicht „die Kampagne, die gerade im Speicher liegt".

**Entscheidung:** `promote`. Der angefragte Key wird primär; `window.D` wird zum Detail genau einer Variante degradiert — der aktiven Kampagne — und ist nur noch erreichbar, wenn `campaignKey === (window.STORAGE_KEY_OVERRIDE || APP_CONFIG.STORAGE_KEY)`. Das ist ausdrücklich ein `promote`, KEIN `add-alongside`: es entsteht kein zweiter Codepfad neben dem alten, die bestehende Stufe 3 bekommt ihren fehlenden Wächter.

**Begründung in einem Satz:** Ein Rückfall, der seinen eigenen Key-Parameter ignoriert, überlebt einen pluralisierten Aufrufer nicht.

**Begleitende Invariante (angenommen, als Task 3 eingeplant):** Für jedes Ziel, das `resolveBackupTargets()` liefert, stammen die in dessen Backup-Datei geschriebenen Daten aus dem eigenen Key dieses Ziels — nie aus dem einer anderen Kampagne. Dieser Test geht in dem Moment rot, in dem eine künftige Phase die singuläre Annahme wieder einführt. **Umgesetzt in Task 3** — siehe Test I oben.

## Markierte, unverifizierte Annahme (aus dem Plan, wortgetreu uebernommen)

Der deterministische Edge-Probe-Bericht dieser Runde führt für **SAFE-02** eine Zeile der Kategorie `unclassified` mit `status: unresolved`. Nach Regel #1110 wird eine `unclassified`-Zeile NICHT automatisch mit einem Backstop aufgelöst — sie bleibt als ausdrücklich markierte Planer-Annahme sichtbar.

**Markierte Annahme (unverifiziert):** Die Abbildung Kampagnen-Key → Kampagnendaten ist total — jedes von `resolveBackupTargets()` gelieferte Ziel löst sich entweder auf seine EIGENEN Daten auf oder auf gar nichts. Ein drittes Ergebnis („die Daten einer anderen Kampagne") ist nach diesem Plan nicht mehr erreichbar, aber diese Totalität ist eine Annahme über die Funktion, kein bewiesenes Gesetz über alle künftigen Aufrufer.

Task 3 hält diese Annahme so eng nach, wie ein Unit-Test es kann (Invariante über alle Ziele eines `_doBackup()`-Laufs). Was er NICHT abdeckt: Aufrufer von `readCampaignDataForBackup()`, die es künftig außerhalb von `_doBackup()` geben könnte. Die Annahme bleibt damit bewusst markiert und unverifiziert — sie gehört (wie hier festgehalten) in `12-VERIFICATION.md` bei der naechsten Re-Verifikation der Phase.

## Issues Encountered

- Beim Ausarbeiten von Test F stellte sich heraus, dass die im Plan-Text skizzierte Rollenverteilung ("Standard-Kampagne" als Opfer, benannte Kampagne aktiv) durch `resolveBackupTargets()`s Dedup-Mechanik (das Pseudo-Ziel "Standard-Kampagne" erhält denselben Key wie der aktive Schlüssel) strukturell nicht funktioniert — siehe Deviations oben. Vor der Implementierung durchgerechnet, nicht durch Trial-and-Error entdeckt: die erste Testausfuehrung (mit der korrigierten Rollenverteilung) war bereits der beabsichtigte Rot-Lauf.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CR-02 ist geschlossen; Plan 12-11 (WR-02 + Rebuild beider `dist/`-Bundles, Welle 8) folgt unverändert dem in `STATE.md` festgehaltenen Fahrplan — dieser Plan hat `systems/file-backup/file-backup-manager.js` und `tests/unit/file-backup.test.js` angefasst, disjunkt von 12-09s Dateien (`migration-wizard.js`) und 12-11s Scope.
- **Nicht durch diesen Plan erledigt:** der offene menschliche Prüfpunkt aus `12-VERIFICATION.md` (`human_verification`) — eine echte Audio-Bibliothek knapp unter 300 MiB im echten Browser-Tab (Recherche-Annahme A1). Bleibt nach den Fixes dieser Runde (12-09/12-10/12-11) erneut fällig.
- **Bewusst offen belassen:** die markierte, unverifizierte Annahme zur Totalität der Key→Daten-Abbildung (siehe oben) — gehört in die nächste Re-Verifikation von `12-VERIFICATION.md`, nicht in diesen Plan.
- `dist/dnd-tracker-bundled.html` und `dist/dnd-tracker-optimized.html` sind NICHT neu gebaut — laut Plan-`<verification>` bewusst Plan 12-11, Task 3 vorbehalten (Rebuild nach allen drei Gap-Closure-Fixes dieser Runde).

## Self-Check: PASSED

- FOUND: `systems/file-backup/file-backup-manager.js`
- FOUND: `tests/unit/file-backup.test.js`
- FOUND: `.planning/phases/12-datensicherheit/12-10-SUMMARY.md`
- FOUND commit `1591ce3` (Task 1, RED)
- FOUND commit `475908e` (Task 2, GREEN + Gegenprobe)
- FOUND commit `2752e07` (Task 3, Invariante)
- `npx jest tests/unit/file-backup.test.js`: 21 passed, 21 total
- `node --check systems/file-backup/file-backup-manager.js`: no findings

---
*Phase: 12-datensicherheit*
*Completed: 2026-09-04*
