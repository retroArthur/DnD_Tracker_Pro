# Phase 8: Test-Fundament grün - Context

**Gathered:** 2026-07-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Die komplette Test-Suite (Jest-Unit + Playwright-E2E) läuft vollständig grün und ist als blockierender CI-Gate vertrauenswürdig. Jeder der 11 vorbestehenden E2E-Fails ist geklärt (Test-Bug behoben oder App-Bug gefixt und dokumentiert), brüchige Assertion-Muster sind suite-weit gehärtet, und die E2E-Suite läuft als blockierender Job in der CI-Pipeline.

Milestone-Leitplanke v1.1 gilt: verhaltensneutral aus Nutzersicht — App-Bug-Fixes (korrektes Verhalten wiederherstellen) sind ausdrücklich im Scope, neue Features nicht.

**Ausgangslage (11 Fails, Stand REQUIREMENTS.md):**
- tab-navigation (7): Registry-Re-Render mit injizierten Daten
- crud-Modifier-Berechnung (2)
- Quest-Titel-Validierung (1)
- Global-Search-Ergebnisse (1)

</domain>

<decisions>
## Implementation Decisions

### App-Bug-Politik
- **D-01:** Echte App-Bugs, die E2E-Fails verursachen, werden **in Phase 8 gefixt** — egal wie tief (z. B. Verdachtsfall: `#random-tables-list` wird bei Tab-Wechseln 9× ins DOM dupliziert, CONCERNS.md Cluster 3). Begründung: Roadmap-Wortlaut „Fail geklärt = Test-Bug behoben ODER App-Bug gefixt"; nur so sind 0 Fails erreichbar. Bugfixes gelten als verhaltensneutral im Sinne der Milestone-Leitplanke.
- **D-02:** Jeder App-Bug-Fix bekommt einen **eigenen gezielten Regressionstest** zusätzlich zum vormals roten E2E-Test: Unit-Test wo möglich, sonst E2E. Der bestehende Test prüft das Symptom, der neue Test die Root-Cause (CLAUDE.md-Muster „Reproduce First").

### CI-Gate
- **D-03:** Die E2E-Suite wird in dieser Phase **blockierend in ci.yml aktiviert**: eigener CI-Job mit Dev-Build (`npm run build:dev`) + `npx playwright test` (Chromium), Failure-Artefakte (Screenshots/Traces) werden hochgeladen. Success Criterion 5 („als CI-Gate nutzbar") wird damit bewiesen, nicht nur behauptet. Kein `continue-on-error`.

### Härtungs-Reichweite
- **D-04:** Assertion-Härtung **suite-weit systematisch**: Inventar aller Zähl-Assertions (`toBeGreaterThan(0)` u. ä.) in Jest + Playwright, dann härten auf exakte Werte (`toBe(N)`) überall dort, wo ein exakter Wert erwartbar ist. Nicht nur die 11 Fail-Specs.
- **D-05:** Fixe Wartezeiten (`page.waitForTimeout(300–500)`) werden **nur in ohnehin angefassten Specs** durch `waitForSelector`/`waitForFunction` ersetzt (opportunistisch). Kein Flächenumbau stabiler Specs — begrenzt das Risiko, Stabiles neu zum Flaken zu bringen.
- **D-06:** Maskierende Event-Dispatches werden per **Kriterium statt Pauschale** beurteilt: `page.evaluate()` ist **verboten**, wenn es den Interaktionspfad ersetzt, den der Test eigentlich prüft (maskierend). Es ist **erlaubt** als dokumentiertes Setup-/Navigations-Vehikel, wenn der Test etwas anderes prüft. Die dokumentierten Bestands-Ausnahmen aus Phasen 4–6 (z. B. `page.evaluate(nextTurn)` wegen Pointer-Interception, `page.evaluate(switchView)` bei Fullscreen-Overlays) werden nach diesem Kriterium einzeln bewertet — nicht pauschal entfernt, nicht pauschal behalten.

### Dokumentation
- **D-07:** Je ehemaligem Fail wird in **`docs/e2e-failure-triage.md`** (bestehendes Dokument, fortschreiben) dokumentiert: Root-Cause-Klassifikation (Test-Bug vs. App-Bug), Fix-Beschreibung, Commit-Hash. Ein Ort, Historie bleibt erhalten.

### Claude's Discretion
- Reihenfolge der Arbeit (erst Fails fixen, dann härten — oder verschränkt)
- Konkrete Playwright-Konfigurationsdetails im CI-Job (Timeout-/Retry-/Worker-Werte; Basis: bestehende CI-Werte in `playwright.config.js` — retries 2, workers 1)
- Wie das Zähl-Assertion-Inventar erhoben wird (Grep-Skript vs. manuell)
- Format der Triage-Doku-Fortschreibung (Tabelle vs. Abschnitte), solange je Fail Klassifikation + Fix + Commit enthalten sind
- Ob der Undo-nach-Delete-Verdacht (CONCERNS.md Cluster 4) noch relevant ist — falls die zugehörigen Tests inzwischen grün sind, genügt eine Kurznotiz in der Triage-Doku

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Fail-Triage & Testbestand
- `docs/e2e-failure-triage.md` — Bestehende Triage der E2E-Fails (Cluster-Klassifikation Test-Bug vs. App-Bug); wird per D-07 fortgeschrieben. ACHTUNG: Stand ggf. 26 Fails (Juni); aktuelle Baseline sind 11 Fails — aktuelle Fail-Liste zu Beginn der Phase frisch erheben (`npm run build:dev && npx playwright test`)
- `.planning/codebase/TESTING.md` — Test-Architektur (Jest/Playwright/pytest, Mock-Konventionen, Helper, Factories); Stand 2026-06-11, Zahlen veraltet
- `.planning/codebase/CONCERNS.md` — Verdachtsfälle: `#random-tables-list`-Runtime-Duplikation (Cluster 3), Undo-nach-Delete (Cluster 4), Tab-Registry-Fragilität
- `tests/e2e/helpers/test-utils.js` — Zentrale E2E-Helper (loadApp, navigateToTab, clickAction, waitForToast …); Ort, an dem maskierende Dispatches versteckt sein können (D-06)

### CI & Konfiguration
- `.github/workflows/ci.yml` — Bestehende Pipeline (lint, typecheck, jest, build) — hier wird der blockierende E2E-Job ergänzt (D-03)
- `playwright.config.js` — E2E-Konfiguration (file://-baseURL gegen `dist/dnd-tracker-bundled.html`, CI: retries 2, workers 1, Artefakte bei Fail)
- `jest.config.cjs` — Unit-Test-Konfiguration (jsdom, coverageThreshold nur für testable-utils)

### Projektregeln
- `CLAUDE.md` — Tab-Registry-Pattern (§ Tab Navigation Architecture), Testing-Guidance, „Reproduce First"-Bugfix-Regel
- `.planning/ROADMAP.md` — Phase-8-Success-Criteria (5 Kriterien, wörtlich)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docs/e2e-failure-triage.md`: fertige Cluster-Analyse als Startpunkt der Fail-Klärung
- `tests/e2e/helpers/test-utils.js`: Shared Helpers + testData-Generatoren — Reparaturen hier entsperren oft mehrere Specs auf einmal (Präzedenz: Phase 4 reparierte 16 Initiative-Tests über den addCombatant-Helper)
- `tests/setup.js`: globale Jest-Factories (createTestCharacter/NPC/Encounter) und Behavioral Mocks — Mock-Namen müssen Produktionsfunktionen exakt matchen (renderInit, nicht renderInitiative)

### Established Patterns
- E2E läuft gegen das **gebaute Bundle** via `file://` — vor jedem E2E-Lauf `npm run build:dev` (auch im CI-Job zwingend)
- Selektoren targeten `data-action`/`data-value` (Event-Delegation), nicht CSS-Klassen
- Assertions primär state-basiert gegen `D` via `page.evaluate`, DOM sekundär
- Unter `file://` ist `localStorage` eingeschränkt — Persistenz via `D`/IndexedDB/StorageAPI prüfen
- Deutsche Testnamen („sollte …"), Abschnitts-Banner in Testdateien
- CI läuft auf Ubuntu — `python3`-Aufrufe funktionieren dort (Windows-Problem irrelevant für D-03)

### Integration Points
- `ci.yml`: neuer E2E-Job neben lint/typecheck/jest/build; braucht Playwright-Browser-Install (`npx playwright install chromium --with-deps`) + Dev-Build als Vorstufe
- `systems/tab-registry.js` + `assets/templates/view-tools.html` + `features/random-tables.js`: wahrscheinlichster Ort der tab-navigation-Fail-Ursache (Registry-Re-Render / Template-Injektion)
- Die Codebase-Map (TESTING.md/CONCERNS.md) ist Stand 2026-06-11 (vor Phasen 3–7): Zahlen (26 Fails, 92 Module, 272 Jest-Tests) sind veraltet — heutige Realität: 11 E2E-Fails, ~123 Module, 453 Jest-Tests. Fakten vor Verwendung gegen den Live-Stand prüfen.

</code_context>

<specifics>
## Specific Ideas

- **Maskierungs-Kriterium (D-06) wörtlich für Planner/Executor:** „Ein `page.evaluate`/manueller Dispatch ist maskierend, wenn der Test die Interaktion prüfen soll, die er umgeht. Er ist legitim, wenn er dokumentiertes Setup/Navigation ist und der Prüfgegenstand ein anderer ist."
- **Doku-Format je Fail (D-07):** Klassifikation (Test-Bug | App-Bug) + Root-Cause in einem Satz + Fix-Beschreibung + Commit-Hash.
- Baseline-Messung als erster Schritt: aktuelle Fail-Liste per frischem Build + `npx playwright test` erheben und gegen die 11 dokumentierten Fails abgleichen (Triage-Doku ist ggf. veraltet).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Bewusst NICHT gewählt, keine Deferrals: flächendeckender `waitForTimeout`-Umbau stabiler Specs — per D-05 auf angefasste Specs begrenzt.)

</deferred>

---

*Phase: 8-Test-Fundament grün*
*Context gathered: 2026-07-22*
