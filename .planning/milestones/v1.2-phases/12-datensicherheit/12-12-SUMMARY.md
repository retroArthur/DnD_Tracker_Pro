---
phase: 12-datensicherheit
plan: 12
subsystem: infra
tags: [file-backup, jest, vm-context, data-integrity, sec-04, sec-03]

# Dependency graph
requires:
  - phase: 12-datensicherheit
    provides: "12-03 (D-03/D-04 resolveBackupTargets()/Kollisions-Suffix), 12-10 (CR-02 Stufe-3-Eingrenzung auf die aktive Kampagne)"
provides:
  - "_hatKampagnenInhalt(): inhaltsbasierte Leerprüfung ersetzt die Schlüsselzahl in allen drei Stufen von readCampaignDataForBackup()"
  - "resolveBackupTargets(): ehrliche Namensauflösung des aktiven Ziels + unbedingte Aufnahme des echten Standard-Keys"
  - "13 neue Regressionstests (SEC-04 A-E, SEC-03 F-J, 3 Invarianten) in tests/unit/file-backup.test.js"
affects: ["12-16 (SEC-05/SEC-06, teilt migration-wizard.js)", "12-17 (Gesamtlauf + dist-Rebuild aller Fix-Pläne)"]

actuals:
  tokens: 8157
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Sperrliste statt Zulassungsliste für Inhaltsprüfungen mit asymmetrischem Risiko (false-negative teurer als false-positive)"
    - "vm.createContext()-Wegwerfkontext zum Lesen echter Konstanten/Funktionen aus einem Nachbarmodul, ohne es zu verändern (Muster aus migration-wizard.test.js wiederverwendet)"
    - "Invarianten-Tests sammeln ALLE Verstöße über eine Zielliste statt beim ersten abzubrechen"

key-files:
  created: []
  modified:
    - systems/file-backup/file-backup-manager.js
    - tests/unit/file-backup.test.js

key-decisions:
  - "_hatKampagnenInhalt() als begründete Sperrliste (nicht Zulassungsliste) — SEC-04 ist ein Verfügbarkeitsproblem, eine zu enge Prüfung wäre der schlimmere Gegenfehler (stiller Totalausfall statt Überschreiben)"
  - "Echter Standard-Key wird primär aus window.APP_CONFIG.STORAGE_KEY ermittelt, mit demselben dnd-tracker-Rückfall wie _sanitizeKeySuffix() — zwei verschiedene Antworten auf dieselbe Frage in derselben Datei wären die Bauart von Widerspruch, die DEBT-17 verursacht hat"
  - "Ein bestehender CR-02-Test (Plan 12-10, Zeile ~518) hatte die SEC-03-Namensverwechslung als 'außerhalb des Scopes' jenes Plans dokumentiert und auf das alte Verhalten gepinnt — Assertion auf das jetzt korrekte Ergebnis (kampagne-a-aktuell.json statt standard-kampagne-aktuell.json) umgestellt; die eigentliche Aussage des Tests (Stufe 3 liefert überhaupt eine Datei) bleibt unverändert"
  - "Invariante 3 vergleicht gegen einen von resolveBackupTargets() UNABHÄNGIGEN erwarteten Namen (Index + Kenntnis des echten Standard-Keys), nicht gegen target.name selbst — sonst hätte der Test die SEC-03-Namensverwechslung strukturell nie erkennen können (in der ersten Fassung des Tests tatsächlich passiert, vor dem roten Lauf korrigiert)"

patterns-established:
  - "Sperrliste-Inhaltsprüfung: alles zählt als Inhalt außer expliziter Buchhaltung/Oberflächen-Einrichtung, mit Ein-Ebene-Tiefenprüfung für verschachtelte Collections (soundboard.scenes, calendar.events, initiative.combatants)"

requirements-completed: [SAFE-02]

coverage:
  - id: D1
    description: "Das echte initializeData() (core/data.js) gilt in keiner Stufe von readCampaignDataForBackup() als sicherungswürdige Kampagne"
    requirement: SAFE-02
    verification:
      - kind: unit
        ref: "tests/unit/file-backup.test.js#SEC-04 Test A"
        status: pass
    human_judgment: false
  - id: D2
    description: "Das createCampaign()-Leerobjekt (16 Schlüssel, campaign-manager.js:31-49) gilt ebenfalls nicht als sicherungswürdig"
    requirement: SAFE-02
    verification:
      - kind: unit
        ref: "tests/unit/file-backup.test.js#SEC-04 Test B"
        status: pass
    human_judgment: false
  - id: D3
    description: "Ein Lauf über ausschließlich leere Quellen lässt -aktuell.json und Tages-Snapshots unangetastet, kein removeEntry()"
    requirement: SAFE-02
    verification:
      - kind: unit
        ref: "tests/unit/file-backup.test.js#SEC-04 Test C"
        status: pass
    human_judgment: false
  - id: D4
    description: "Ein Lauf ohne einen einzigen Erfolg endet sichtbar in 'paused' mit Warn-Toast statt still in 'active'"
    requirement: SAFE-02
    verification:
      - kind: unit
        ref: "tests/unit/file-backup.test.js#SEC-04 Test D"
        status: pass
    human_judgment: false
  - id: D5
    description: "Eine Kampagne mit nur einer gefüllten Sammlung außerhalb der Kern-Trias (spells) bekommt weiterhin ihr Backup (Gegenprobe gegen Übercorrection)"
    requirement: SAFE-02
    verification:
      - kind: unit
        ref: "tests/unit/file-backup.test.js#SEC-04 Test E"
        status: pass
    human_judgment: false
  - id: D6
    description: "Die aktive benannte Kampagne trägt ihren echten Namen im Backup-Dateinamen statt bedingungslos 'Standard-Kampagne'"
    requirement: SAFE-02
    verification:
      - kind: unit
        ref: "tests/unit/file-backup.test.js#SEC-03 Test F"
        status: pass
    human_judgment: false
  - id: D7
    description: "Die literale Standard-Kampagne bleibt Backup-Ziel, auch wenn eine andere Kampagne aktiv ist — ihre Dateiserie verwaist nicht beim Kampagnenwechsel"
    requirement: SAFE-02
    verification:
      - kind: unit
        ref: "tests/unit/file-backup.test.js#SEC-03 Test H"
        status: pass
    human_judgment: false
  - id: D8
    description: "D-07-Implikation: hasCampaignContent(d) === true impliziert, dass das Backup d für sicherungswürdig hält (geprüft gegen das ECHTE migration-wizard.js)"
    requirement: SAFE-02
    verification:
      - kind: unit
        ref: "tests/unit/file-backup.test.js#Invariante 1 (D-07)"
        status: pass
    human_judgment: false
  - id: D9
    description: "Mutationsnachweis SEC-04 und SEC-03: bei zurückgesetztem Fix fallen genau die zugehörigen benannten Tests um, alle übrigen bleiben grün"
    requirement: SAFE-02
    verification:
      - kind: unit
        ref: "manuelle Mutation von _hatKampagnenInhalt() und resolveBackupTargets() gegen tests/unit/file-backup.test.js (siehe Abschnitt 'Mutationsnachweise' unten)"
        status: pass
    human_judgment: false

duration: ~45min
completed: 2026-09-05
status: complete
---

# Phase 12 Plan 12: SEC-04/SEC-03 Backup-Datensicherheit Summary

**Inhaltsbasierte Leerprüfung (`_hatKampagnenInhalt()`) ersetzt die reine Schlüsselzahl in `readCampaignDataForBackup()`, und `resolveBackupTargets()` löst den Namen des aktiven Backup-Ziels jetzt aus dem Index auf statt ihn bedingungslos "Standard-Kampagne" zu nennen.**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-09-05 (Wave 9, parallel zu 12-13/12-14/12-15)
- **Completed:** 2026-09-05T10:07:54Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- **SEC-04 (critical) geschlossen:** `_hatKampagnenInhalt()` prüft echten Inhalt (nicht leere Arrays/Strings/Zahlen/`true`/eine Ebene tief verschachtelte Collections) statt `Object.keys(obj).length > 0`. Ein komplett leeres Kampagnenschema — egal ob `initializeData()` (core/data.js, 23 Schlüssel) oder das abweichende 16-Schlüssel-Leerobjekt aus `createCampaign()` — liefert jetzt in allen drei Stufen von `readCampaignDataForBackup()` `null`. Der vorhandene DEBT-17-Wächter (`if (!data) continue`) und `pruneOldSnapshots()` sind dadurch wieder wirksam, ohne selbst angefasst zu werden.
- **SEC-03 (high) geschlossen:** `resolveBackupTargets()` löst den Namen des ersten (aktiven) Ziels jetzt ehrlich auf: ist der `storageKey` der echte Standard-Key (`window.APP_CONFIG.STORAGE_KEY`, mit demselben `dnd-tracker`-Rückfall wie `_sanitizeKeySuffix()`), bleibt der Name unverändert "Standard-Kampagne"; andernfalls kommt der Name aus dem Index-Eintrag der aktiven Kampagne. Die literale Standard-Kampagne wird danach unbedingt als zusätzliches Ziel aufgenommen, sofern sie noch nicht gesehen wurde — ihre Dateiserie verwaist nicht mehr beim Kampagnenwechsel.
- **D-07-Vertrag als Implikation getestet:** `hasCampaignContent(d) === true ⟹ Backup hält d für sicherungswürdig`, geprüft gegen die ECHTEN Inhaltslisten aus `systems/migration/migration-wizard.js` (per Wegwerf-vm-Kontext gelesen, nicht verändert) — nicht gegen eine Abschrift.
- **13 neue Tests**, alle mit rotem Vorlauf vor dem jeweiligen Fix protokolliert; volle Datei 38/38 grün (Basislinie 25 + 13).

## Task Commits

Jeder Task folgte RED → GREEN (TDD):

1. **Task 1 (RED): SEC-04 rote Tests** — `519b914` (test)
2. **Task 1 (GREEN): SEC-04 Fix `_hatKampagnenInhalt()`** — `29387ed` (feat)
3. **Task 2 (RED): SEC-03 rote Tests** — `c674a42` (test)
4. **Task 2 (GREEN): SEC-03 Fix `resolveBackupTargets()` + Anpassung eines bestehenden CR-02-Tests** — `f027fbc` (feat)
5. **Task 3: Invarianten (kein Produktionscode)** — `060e47c` (test)

**Plan metadata:** siehe Abschnitt "Final Commit" (folgt nach diesem SUMMARY).

## Files Created/Modified

- `systems/file-backup/file-backup-manager.js` — neue Top-Level-Funktion `_hatKampagnenInhalt()` (SEC-04) + begründete Sperrliste `_KAMPAGNEN_INHALT_SPERRLISTE`; `readCampaignDataForBackup()`-Stufen 1-3 nutzen sie statt der Schlüsselzahl; `resolveBackupTargets()` löst den Namen des aktiven Ziels aus dem Index auf und nimmt den echten Standard-Key unbedingt als Ziel auf (SEC-03); JSDoc beider Funktionen nachgezogen.
- `tests/unit/file-backup.test.js` — 13 neue Tests (SEC-04 A-E, SEC-03 F-J, Invarianten 1-3) plus Anpassung eines bestehenden CR-02-Tests (Zeile ~518) auf das jetzt korrekte Verhalten.

## Decisions Made

Siehe `key-decisions` im Frontmatter. Zusammengefasst: Sperrliste statt Zulassungsliste für die Inhaltsprüfung (Risikoprofil beim Backup ist spiegelverkehrt zum Wizard — ein falsches "leer" ist hier der teurere Fehler); echter Standard-Key wird konsistent mit `_sanitizeKeySuffix()` ermittelt, um keinen zweiten, widersprüchlichen Rückfall einzuführen.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Bestehender CR-02-Test (Plan 12-10) codierte exakt den SEC-03-Bug und musste angepasst werden**
- **Found during:** Task 2 (GREEN-Phase, nach Implementierung des SEC-03-Fixes)
- **Issue:** `tests/unit/file-backup.test.js:518` ("CR-02: die aktive Kampagne bekommt ihr Backup auch dann, wenn sie nur im laufenden Speicher steht") prüfte explizit, dass die Backup-Datei einer aktiven, nur im Speicher stehenden Kampagne unter `standard-kampagne-aktuell.json` landet — der Testkommentar selbst dokumentierte das als "außerhalb des Scopes dieses Plans" (12-10) liegenden Bug, der jetzt durch SEC-03 (12-12) behoben wird. Nach dem Fix trägt dieselbe Kampagne korrekt den Namen `kampagne-a-aktuell.json`, wodurch der alte Test rot wurde.
- **Fix:** Assertion und Kommentar auf das jetzt korrekte Ergebnis umgestellt (`kampagne-a-aktuell.json` statt `standard-kampagne-aktuell.json`); die eigentliche Kernaussage des Tests (Stufe 3 liefert die Datei überhaupt, CR-02-Fix grenzt ein statt abzuschalten) bleibt unverändert.
- **Files modified:** `tests/unit/file-backup.test.js`
- **Verification:** `npx jest tests/unit/file-backup.test.js` — alle 35 (später 38) Tests grün, inklusive aller übrigen CR-02-Tests.
- **Committed in:** `f027fbc` (Task 2 feat-Commit)

**2. [Rule 1 - Bug] Erste Fassung von "Invariante 3" konnte die SEC-03-Namensverwechslung strukturell nicht erkennen**
- **Found during:** Task 3, beim ersten roten Testlauf vor dem SEC-03-Fix
- **Issue:** Die ursprüngliche Testversion berechnete den "erwarteten" `safeName`-Kern aus `target.name` — dem Feld, das der Bug selbst beeinflusst. Ein falsch zugewiesener Name hätte dadurch auch seinen eigenen "erwarteten" Kern korrekt geliefert; der Test konnte den Fehler, den er beweisen sollte, nicht erreichen (blieb fälschlich grün vor dem Fix).
- **Fix:** Erwarteter Name je Key kommt jetzt aus einer von `resolveBackupTargets()` unabhängigen Quelle (fest verdrahtete Tabelle aus Index-Namen + Kenntnis des echten Standard-Keys). Damit erreicht der Test die SEC-03-Regression nachweislich (verifiziert im Mutationsnachweis).
- **Files modified:** `tests/unit/file-backup.test.js`
- **Verification:** Vor der Korrektur lief der Test grün auch mit unverändertem (Bug-)Produktionscode; nach der Korrektur schlägt er korrekt rot fehl, bis der SEC-03-Fix vorliegt.
- **Committed in:** In den Task-1/2-RED-Commits noch nicht sichtbar — die Korrektur erfolgte vor dem finalen `060e47c`-Commit, sodass nur die korrigierte Fassung ins Repository gelangt ist.

---

**Total deviations:** 2 auto-fixed (beide Rule 1 — Testkorrekturen, kein Produktionscode-Scope-Creep)
**Impact on plan:** Beide Anpassungen waren notwendig, damit die Testsuite den tatsächlichen SEC-03-Fix korrekt beweist bzw. nicht fälschlich auf altem Verhalten beharrt. Kein zusätzlicher Produktionscode-Scope.

## Rote Vorläufe (Testbasislinie und Beweispflicht)

- **Testbasislinie vor Plan 12-12:** `npx jest tests/unit/file-backup.test.js` → 25/25 grün.
- **Task 1, roter Lauf (vor SEC-04-Fix):** 30 Tests gesamt (Basislinie 25 + 5 neue), **4 fehlgeschlagen** (SEC-04 Test A/B/C/D), Test E bereits grün (Gegenprobe — echter Inhalt in `spells` wurde auch von der alten Schlüsselzahl-Prüfung korrekt erkannt).
- **Task 2, roter Lauf (vor SEC-03-Fix):** 35 Tests gesamt (30 + 5 neue), **3 fehlgeschlagen** (SEC-03 Test F/G/H), Test I/J bereits grün (gepinntes Bestandsverhalten: Standardfall unverändert, Rückfall ohne `APP_CONFIG` unverändert).
- **Task 3:** keine Produktionsänderung; nach Einfügen der 3 Invarianten-Tests direkt 38/38 grün (die zugrundeliegenden Fixes waren bereits committed).

## Mutationsnachweise

**SEC-04 (`_hatKampagnenInhalt()`):** Funktion testweise auf die alte Schlüsselzahl (`Object.keys(obj).length > 0`) zurückgesetzt → genau **4 Tests fallen um** (SEC-04 Test A/B/C/D), alle übrigen 26 bleiben grün. Fix zurückgenommen → wieder 30/30 grün.

**SEC-03 (`resolveBackupTargets()`):** Funktion testweise auf die alte, bedingungslose `{ name: 'Standard-Kampagne' }`-Vergabe für das erste Ziel zurückgesetzt (kein unbedingter Push des echten Standard-Keys) → genau **4 Tests fallen um**: SEC-03 Test F/G/H **und** der angepasste CR-02-Test (Zeile ~518, der jetzt das korrigierte Verhalten prüft). Alle übrigen 31 bleiben grün. Fix zurückgenommen → wieder 35/35 grün, inklusive `file-backup-hook.test.js`/`file-backup-idb.test.js` (14/14).

**Invarianten (Task 3), je einmal absichtlich gebrochen:**
- **Invariante 1:** `'characters'` testweise auf die Sperrliste `_KAMPAGNEN_INHALT_SPERRLISTE` gesetzt → Test meldet genau einen Verstoß: `"Array \"characters\" gefuellt"`. Zurückgenommen → grün.
- **Invariante 2:** `_hatKampagnenInhalt()` erneut auf die alte Schlüsselzahl zurückgesetzt → Test meldet zwei Verstöße: `dnd-tracker-data` und `dnd-campaign-2` (beide leer, aber es entstanden Dateien). Zurückgenommen → grün.
- **Invariante 3:** `resolveBackupTargets()` erneut auf die alte, bedingungslose Namensvergabe zurückgesetzt → Test meldet einen Verstoß: `dnd-campaign-1234`s `safeName` leitet sich von `"standard-kampagne"` statt vom eigenen Namen `"Die Tiefen von Phandalin"` ab. Zurückgenommen → grün.

Nach jeder Mutation wurde die Datei zurückgesetzt und die volle Datei erneut auf 38/38 grün geprüft.

## Bewusste Nebenwirkung (wie im Plan gefordert benannt)

Eine vom Nutzer **absichtlich vollständig geleerte** Kampagne (alle Sammlungen manuell gelöscht, sodass `_hatKampagnenInhalt()` `false` liefert) bekommt ab jetzt **kein neues Backup mehr** — ihre vorhandene, zuvor geschriebene Sicherung bleibt unverändert stehen (weder überschrieben noch gelöscht). Das ist die sichere Richtung: der Ausfall des Primärspeichers (SEC-04s eigentliches Szenario) sieht aus Sicht von `_hatKampagnenInhalt()` identisch aus wie eine absichtliche Leerung — beide dürfen die letzte gute Sicherung nicht verdrängen. Dieselbe Politik gilt bereits für den DEBT-17-Schutz (`if (!data) continue`); dieser Plan macht sie nur wieder wirksam, führt sie nicht neu ein.

## Issues Encountered

Keine über die dokumentierten Deviations hinaus. Die Windows-CRLF-Zeilenenden in `file-backup-manager.js` erschwerten die node-basierten Mutationsnachweise leicht (naive Zeilenvergleiche gegen `'}'` trafen verschachtelte schließende Klammern statt der Funktionsgrenze) — gelöst über Klammertiefen-Tracking statt Zeilenvergleich; kein Produktionscode betroffen.

## User Setup Required

None - keine externe Service-Konfiguration nötig.

## Next Phase Readiness

- SEC-04 und SEC-03 aus `12-VERIFICATION.md` sind geschlossen; verbleibende offene Gap-Pläne der Welle 9 sind 12-13 (SEC-02) und 12-14 (SEC-01) — beide unabhängig von diesem Plan.
- Welle 10 (Plan 12-16, SEC-05/SEC-06 + WR-03, teilt sich `migration-wizard.js`) bleibt gesperrt, bis alle vier Wave-9-Pläne (12-12 bis 12-15) abgeschlossen sind. 12-12 und 12-15 sind jetzt fertig.
- Welle 11 (Plan 12-17, Gesamtlauf + `dist/`-Rebuild beider Bundles) folgt danach — dieser Plan hat `dist/` bewusst nicht angefasst.
- Volle Unit-Suite: 866/866 grün (vor diesem Plan 853, +13 durch diesen Plan).

---
*Phase: 12-datensicherheit*
*Completed: 2026-09-05*

## Self-Check: PASSED

- FOUND: systems/file-backup/file-backup-manager.js
- FOUND: tests/unit/file-backup.test.js
- FOUND: .planning/phases/12-datensicherheit/12-12-SUMMARY.md
- FOUND commit: 519b914 (test SEC-04 RED)
- FOUND commit: 29387ed (feat SEC-04 GREEN)
- FOUND commit: c674a42 (test SEC-03 RED)
- FOUND commit: f027fbc (feat SEC-03 GREEN)
- FOUND commit: 060e47c (test Invarianten)
