---
phase: 14-tests-gates
plan: 07
subsystem: testing
tags: [typescript, tsc, checkJs, ci, tsconfig]

requires:
  - phase: 14-tests-gates
    provides: "14-06 Lint-Ratsche (367 Warnungen, no-undef:error) und die 14-GATE-BASELINE.md Messmethodik als Formvorbild"
provides:
  - "tsconfig.strict.json — zweite, scharfe (checkJs:true) Typpruefung mit eingecheckter, nur wachsender Zulassungsliste"
  - "npm-Skript typecheck:strict, verankert in CI (lint-and-typecheck) und im Sammelbefehl check"
  - "Benannter Restposten fuer DEBT-01 mit gemessener Fehlerzahl (1751/117/134)"
affects: [ci, package.json, tsconfig]

actuals:
  tokens: 9000
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Zweite tsconfig via extends fuer graduelle Typstrenge, statt globales checkJs an/aus"
    - "Selbstkonsistenz-Probe: eine Zulassungsliste muss gegen ihre EIGENE (schmale) include-Menge gemessen werden, nicht gegen den vollen Kontext — sonst zaehlt sie Dateien mit, die nur wegen fremder globaler Deklarationen fehlerfrei erscheinen"

key-files:
  created:
    - tsconfig.strict.json
  modified:
    - package.json
    - .github/workflows/ci.yml
    - .planning/phases/14-tests-gates/14-GATE-BASELINE.md

key-decisions:
  - "Zulassungsliste auf 8 statt der zunaechst gemessenen 17 Dateien reduziert: eine zweite Selbstkonsistenz-Probe gegen die tatsaechliche schmale include-Menge deckte auf, dass 9 der 17 Kandidaten auf globale Symbole aus ausgeschlossenen Dateien verweisen (EntityLookup, StorageAPI, window.render*-Familie) — Artefakt des Non-ESM-globalen-Scopes, keine Regression dieser Dateien."
  - "npm run check bleibt am format:check-Schritt rot (~131 Dateien Prettier-Debt) — vorbestehend, per Umgebungshinweis ausdruecklich out-of-scope; tsc:check, typecheck:strict und lint bestehen einzeln alle mit Exit 0."

requirements-completed: [TEST-05]

coverage:
  - id: D1
    description: "tsconfig.strict.json prueft JavaScript mit checkJs:true gegen eine frisch erhobene, eingecheckte Zulassungsliste und endet mit Exit 0"
    requirement: TEST-05
    verification:
      - kind: other
        ref: "npm run typecheck:strict"
        status: pass
    human_judgment: false
  - id: D2
    description: "tsconfig.json bleibt unveraendert (checkJs global aus, Deklarations-Emission bleibt seine Aufgabe)"
    verification:
      - kind: other
        ref: "git diff --quiet -- tsconfig.json"
        status: pass
    human_judgment: false
  - id: D3
    description: "CI-Job lint-and-typecheck fuehrt den strikten Typecheck aus; npm run check ebenfalls — dieselbe Menge in CI und lokal"
    requirement: TEST-05
    verification:
      - kind: other
        ref: "grep typecheck:strict .github/workflows/ci.yml + node -e Pruefung von package.json scripts.check"
        status: pass
    human_judgment: false
  - id: D4
    description: "npm run check laeuft als Ganzes durch (tsc:check + typecheck:strict + lint + format:check)"
    verification:
      - kind: other
        ref: "npm run check"
        status: fail
    human_judgment: true
    rationale: "format:check scheitert auf ~131 vorbestehenden Dateien (Prettier-Debt aus frueheren Phasen, laut Umgebungshinweis explizit out-of-scope fuer diesen Plan). tsc:check, typecheck:strict und lint bestehen einzeln jeweils mit Exit 0 — das rote Gesamtergebnis ist ausschliesslich dem vorbestehenden Format-Debt zuzuschreiben, nicht dieser Aenderung. Ein Mensch sollte bestaetigen, dass dies als bekannte, akzeptierte Abweichung gilt."
  - id: D5
    description: "Der offene DEBT-01-Restposten ist mit gemessener Fehlerzahl statt als erledigt im Messprotokoll benannt"
    verification:
      - kind: other
        ref: "grep DEBT-01 .planning/phases/14-tests-gates/14-GATE-BASELINE.md"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-09-07
status: complete
---

# Phase 14 Plan 07: Strikter Typecheck (D-11) Summary

**Zweite tsconfig.strict.json mit `checkJs: true` gegen eine frisch erhobene, 8-Datei-Zulassungsliste — eine Selbstkonsistenz-Probe deckte auf, dass 9 der zunaechst 17 gemessenen Kandidaten nur unter vollem Compile-Kontext fehlerfrei sind, nicht isoliert.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 2
- **Files modified:** 3 (package.json, .github/workflows/ci.yml, 14-GATE-BASELINE.md) + 1 neu (tsconfig.strict.json)

## Accomplishments

- `tsconfig.strict.json` erbt per `extends` von `tsconfig.json`, ueberschreibt genau `checkJs`,
  `noEmit`, `emitDeclarationOnly`; `tsconfig.json` bleibt textuell unveraendert (`git diff --quiet`
  bestaetigt).
- Zulassungsliste zweistufig frisch erhoben (nicht aus CONTEXT.md/RESEARCH.md/GATE-BASELINE.md
  uebernommen): Stufe 1 (voller 134-Datei-Kontext) ergab 17 Kandidaten — identisch mit der bereits
  in `14-GATE-BASELINE.md` (Plan 14-01) dokumentierten Liste. Stufe 2 (Selbstkonsistenz gegen die
  tatsaechlich schmale `include`-Menge) verwarf 9 davon, weil sie auf globale Symbole aus
  ausgeschlossenen Dateien verweisen (`EntityLookup`, `StorageAPI`, diverse `window.render*`-
  Funktionen) — ein Artefakt der Non-ESM-globalen-Script-Architektur, keine Regression der neun
  Dateien. Die verbleibenden 8 Dateien sind unter der tatsaechlichen `tsconfig.strict.json`-
  `include`-Menge nachweislich fehlerfrei.
- `npm run typecheck:strict` neu in `package.json`, Exit 0.
- CI-Job `lint-and-typecheck` fuehrt den strikten Typecheck nach dem Basis-Typecheck und vor Lint
  aus; `needs:`-Kette unveraendert, damit der neue Schritt automatisch `e2e`/`build`/`smoke-test`/
  `deploy` blockiert, wenn er rot wird.
- `npm run check` verkettet zusaetzlich `typecheck:strict` — CI und lokaler Sammelbefehl pruefen
  dieselbe Menge.
- `14-GATE-BASELINE.md` um Abschnitt „Offener Restposten DEBT-01" ergaenzt: 1751 Fehler ueber
  117 von 134 Dateien (Neumessung nach den `no-undef`-Fixes aus Plan 14-06; vorherige Messung in
  Messblock 2 war 1758 — Differenz von genau 7 entspricht den sieben in 14-06 behobenen
  Referenzen), Aufschluesselung nach TS-Code (92% TS2339 aus dem `window`/`D`-Zugriffsmuster),
  und die Begruendung fuer 8 statt 17 zugelassene Dateien.

## Task Commits

1. **Task 1: Zulassungsliste frisch erheben und `tsconfig.strict.json` festschreiben** - `d595f16` (feat)
2. **Task 2: Strikten Typecheck in CI und im Sammelbefehl verankern, Restposten benennen** - `bec2237` (feat)

## Files Created/Modified

- `tsconfig.strict.json` - Zweite Typpruefung, `checkJs: true`, 8-Datei-Zulassungsliste + `types/**/*.d.ts`
- `package.json` - Neues Skript `typecheck:strict`; `check` verkettet es zusaetzlich
- `.github/workflows/ci.yml` - `lint-and-typecheck`-Job fuehrt `npm run typecheck:strict` aus
- `.planning/phases/14-tests-gates/14-GATE-BASELINE.md` - Abschnitt „Offener Restposten DEBT-01"

## Decisions Made

- **8 statt 17 zugelassene Dateien:** Die im Plan beschriebene einstufige Messmethodik (voller
  134-Datei-Kontext, dann die dort fehlerfreien Dateien 1:1 in die schmale `include`-Menge von
  `tsconfig.strict.json` uebernehmen) funktioniert fuer diese Codebase nicht unveraendert, weil
  TypeScript in Non-Modul-Skript-Dateien Top-Level-Deklarationen ALLER kompilierten Dateien in
  denselben globalen Scope mischt (siehe CLAUDE.md „Global Namespace"). Eine schmalere
  `include`-Menge verliert Kontext, den manche der 17 Kandidaten brauchen (`EntityLookup` aus
  `render/helpers.js`, `StorageAPI`, ueber 20 Wiki-Aktionsfunktionen, mehrere
  `window.render*`-Funktionen) — das erzeugte 9 neue Fehler, die im vollen Kontext nicht auftraten.
  Fix: eine zweite Selbstkonsistenz-Probe gegen die tatsaechliche schmale `include`-Menge
  durchgefuehrt und nur die dabei wirklich fehlerfreien 8 Dateien uebernommen. Das ist die einzige
  Messung, die fuer das tatsaechlich laufende Gate (`npm run typecheck:strict`) relevant ist. Der
  vollstaendige Herleitungsweg steht als Kommentar in `tsconfig.strict.json` und im neuen
  DEBT-01-Abschnitt von `14-GATE-BASELINE.md`.
- **`npm run check` bleibt rot am `format:check`-Schritt:** ~131 Dateien Prettier-Formatierungsdebt
  aus fruaeheren Phasen, laut Umgebungshinweis des Ausfuehrungskontexts ausdruecklich „nicht deine
  Baustelle, nicht anfassen". `tsc:check`, `typecheck:strict` und `lint` bestehen einzeln jeweils
  mit Exit 0 — nur die Verkettung als Ganzes ist rot, und zwar aus einem Grund, der vor diesem Plan
  bestand und von ihm nicht veraendert wurde. Siehe Deviations unten.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zulassungsliste von 17 auf 8 Dateien korrigiert (Selbstkonsistenz-Fund)**
- **Found during:** Task 1, Verifikationsschritt `npm run typecheck:strict`
- **Issue:** Die im Plan beschriebene Messmethodik (fehlerfreie Dateien unter vollem 134-Datei-Kontext
  1:1 in die schmale `tsconfig.strict.json`-`include`-Menge uebernehmen) fuehrt bei dieser Non-ESM-
  Architektur zu einem falschen Gruen: 9 von 17 Kandidaten sind nur fehlerfrei, WEIL andere Dateien
  im vollen Kontext mit dabei sind (deren globale `const`/`function`-Deklarationen sie brauchen).
  Isoliert unter der tatsaechlichen `tsconfig.strict.json`-Menge werfen sie 66 neue Fehler
  (`Cannot find name 'EntityLookup'`, `Cannot find name 'StorageAPI'`, `Property 'renderCombatantEffects' does not exist on type Window`, u.v.m.), die im vollen Kontext nicht auftraten.
- **Fix:** Zweite Probe direkt gegen die schmale `include`-Menge durchgefuehrt (identisch zur
  Konfiguration, die `tsconfig.strict.json` tatsaechlich verwendet); die 9 Dateien, die dabei
  Fehler werfen, aus der Liste entfernt. Verbleibende 8 Dateien sind unter dieser Menge nachweislich
  fehlerfrei (`npm run typecheck:strict` Exit 0).
- **Files modified:** tsconfig.strict.json
- **Verification:** `npm run typecheck:strict` Exit 0; `npx tsc --noEmit` weiterhin Exit 0;
  `git diff --quiet -- tsconfig.json` leer; keine neuen `.d.ts`-Dateien.
- **Committed in:** d595f16 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 1 — methodischer Bugfix in der eigenen Messung)
**Impact on plan:** Kein Scope-Creep — die Korrektur bleibt innerhalb von Task 1 (Zulassungsliste
erheben und festschreiben) und macht das Gate tatsaechlich das pruefen, was es zu pruefen behauptet,
statt eines falschen Gruens, das nur wegen fremdem Compile-Kontext entstanden waere. Die Begruendung
ist vollstaendig als Kommentar in `tsconfig.strict.json` und als Abschnitt in `14-GATE-BASELINE.md`
dokumentiert.

## Issues Encountered

- **`npm run check` scheitert am vorbestehenden `format:check`-Schritt (~131 Dateien Prettier-Debt).**
  Der Plan-`<verify>`-Block fordert `npm run check` mit Exit 0; der Ausfuehrungskontext (environment_notes)
  weist diesen Zustand explizit als vorbestehend und „nicht deine Baustelle" aus. Reformatieren von
  131 unbeteiligten Dateien waere klarer Scope-Creep (Deviation-Regel „Scope Boundary": nur Probleme
  beheben, die direkt von den eigenen Aenderungen verursacht wurden) und wuerde die eigentliche
  Aenderung dieses Plans (den neuen `typecheck:strict`-Schritt) in einem riesigen, unrelated Diff
  verstecken. Stattdessen einzeln verifiziert: `tsc:check`, `typecheck:strict` und `lint` bestehen
  je fuer sich mit Exit 0 — die neue Verkettung ist korrekt, das rote Gesamtergebnis ist
  ausschliesslich dem vorbestehenden Format-Debt zuzuschreiben. Nicht behoben, dokumentiert als
  `coverage`-Eintrag D4 mit `human_judgment: true`.

## User Setup Required

None - keine externe Dienstkonfiguration noetig.

## Next Phase Readiness

- `npm run typecheck:strict` und `npx tsc --noEmit` sind beide gruen und in CI verankert.
- DEBT-01 ist zu einem kleinen, aber echten Teil geschlossen (8/134 Dateien); der Restposten
  (126 Dateien, 1751 Fehler, ~92% aus dem `window`/`D`-Zugriffsmuster) steht mit Zahl im
  Messprotokoll, nicht als erledigt gefuehrt — Voraussetzung fuer den naechsten Schritt (echte
  `AppData`-Typbeschreibung statt `any`) ist benannt.
- Bekannte, vorbestehende und nicht in diesem Plan behobene Ausnahme: `npm run check` bleibt am
  `format:check`-Schritt rot (Prettier-Debt, ~131 Dateien) — fuer eine spaetere, dedizierte
  Formatierungs-Aufraeum-Runde vorgemerkt, nicht Teil von Phase 14s Scope.

---
*Phase: 14-tests-gates*
*Completed: 2026-09-07*

## Self-Check: PASSED

- `tsconfig.strict.json` exists on disk
- `.planning/phases/14-tests-gates/14-07-SUMMARY.md` exists on disk
- Commits `d595f16`, `bec2237`, `f8ce20e` all present in `git log --oneline --all`
