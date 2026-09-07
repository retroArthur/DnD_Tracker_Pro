# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Stabilisierung & Ausbau

**Shipped:** 2026-07-22
**Phases:** 7 | **Plans:** 44 | **Commits:** 517 (28.12.2025 → 22.07.2026)

### What Was Built
- Von „App startet nicht" zum vollständigen offline-first Spielleiter-Begleiter: stabiler file://-Boot mit LS+IDB-Dual-Persistenz, installierbare PWA (Pages-Deploy, SW-Updates, Datei-Backup, Migrations-Wizard)
- 112 deutsche SRD-Statblocks offline, Kampf-Tiefe (Legendary/Mob/Death-Saves/Concentration/AoE), Welt & Story (NPC-Generator, Harptos-Kalender, Reise, Fraktionen), Spieler-Verwaltung (XP/Milestone, klickbare Würfe), Soundboard mit Crossfade-Szenen, Würfel-Statistiken
- Testfundament: 453 Unit-Tests, Phasen-E2E, CI mit Deploy-Gate; 20/20 Human-UAT-Szenarien

### What Worked
- **Sequenzielle Executor auf `main`** (statt Worktrees) ab Phase 5: 0 Merge-Konflikte trotz geteilter Dateien in fast jedem Plan; Spot-Checks (SUMMARY + Commits) fingen Executor-Abbrüche zuverlässig
- **Human-UAT als eigener Gate**: fand 8+ echte Bugs, die alle automatisierten Suiten verpassten (Doppel-Import, Audio-läuft-weiter, Live-Volume, Manifest-CORS, Datei-Backup-Hook, fehlender Ordner-Wechsel) — inklusive eines strukturellen Architektur-Bugs
- **Code-Review-Gate nach Phasen-Execution**: CR-01 (tote Soundboard-Klick-Aktionen) hätte sonst geshippt — E2E war grün, weil der Keyboard-Pfad den Klick-Pfad umging
- **Wave-0-Test-Stubs mit Vertrags-Testnamen** (VALIDATION `-t`/`-g`): Feature-Pläne aktivierten exakt benannte Tests statt eigene zu erfinden

### What Was Inefficient
- **Fixes am falschen Ort durch ungenaue Bug-Reports**: „Sitzung löschen" ≠ „Szene löschen" kostete einen kompletten Fix-Zyklus (deleteCampaign statt deleteScene) — erst die Rückfrage nach dem exakten Klickpfad löste es
- **348 Commits ungepusht über Monate**: Remote-Divergenz (7 Mai-Commits, racender pages.yml-Deploy) musste beim Milestone-Abschluss unter Zeitdruck gemergt werden — früher/regelmäßig pushen
- **Selbst gebaute Test-Snippets mit falschen Annahmen** (window.STORAGE_KEY in der Konsole undefined; Date.now()-IDs > _nextId) erzeugten Schein-Fehlschläge, die von echten Befunden ablenkten
- **SW-/Pages-Cache-Latenz** (max-age=600) machte Live-Re-Tests zäh — „zu früh getestet" wirkte zweimal wie ein fehlgeschlagener Fix

### Patterns Established
- **`registerPostSaveHook` statt `window.save`-Wrapping**: globale `const`-Bindungen überdecken window-Properties dauerhaft — Monkey-Patches auf window-Funktionen sind in dieser Architektur strukturell wirkungslos (CLAUDE.md-Pattern korrigiert)
- **String-IDs immer via `ctx.target.dataset.id`** (nie `ctx.id`/`parseEntityId`) — dritter Vorfall dieser Klasse (03-03, CR-01, toggle-track-loop präventiv)
- **Baseline-Beweis per `git stash` bei Suite-Fehlschlägen**: 11 vorbestehende E2E-Fails sauber von Regressionen getrennt
- **Erst diagnostizieren, welcher Code im Browser läuft** (Version-Marker in Console prüfen), bevor ein „Fix wirkt nicht" untersucht wird

### Key Lessons
1. Grüne E2E-Tests beweisen nur die getesteten Pfade — der Doppel-Import wurde von einem manuellen `dispatchEvent('change')` im Test maskiert; Assertions auf exakte Zählwerte (`toBe(1)` statt `toBeGreaterThan(0)`) hätten ihn gefangen
2. Bei „Fix wirkt nicht" zuerst klären: (a) läuft der neue Code überhaupt (SW-Cache!), (b) war es wirklich der gemeldete Auslöser — bevor tiefer gegraben wird
3. UAT-Bugs sofort fixen und im selben Durchlauf re-testen lassen hält den Kontext heiß und die Fix-Qualität hoch (alle 8 UAT-Bugs am selben Tag verifiziert)

### Cost Observations
- Sessions: GSD-Workflow über ~6 Wochen (Planung 2026-06-11 → Ship 2026-07-22); Ausführung überwiegend sonnet-Executor mit Opus-Orchestrierung
- Notable: UAT-getriebene Fix-Zyklen (verify-work → diagnose → fix → re-test) waren der effizienteste Bug-Finder des Projekts — deutlich höhere Trefferquote als Code-Review auf ruhendem Code

## Milestone: v1.2 — Schulden-Abbau

**Shipped:** 2026-09-07
**Phasen:** 3 (12–14) | **Pläne:** 38 | **Commits:** 241 | **Dauer:** 32 Tage (2026-08-06 → 2026-09-07)

### What Was Built

Der `DEBT`-Backlog aus der v1.1-Triage — 26 Posten über 19 Requirements — ist abgearbeitet.
Datenverlust-Risiken zuerst (Umzugs-Export nimmt IndexedDB mit, Audio-Löschen ist rückgängig, das
Datei-Backup kann seine eigene gute Sicherung nicht mehr durch ein leeres Schema überschreiben),
dann Härtung und Wartbarkeit (`call`-Whitelist mit 130 Zielen, vier Module mit 1500–1900 Zeilen in
14 Dateien aufgeteilt, `execCommand` auf 0), zuletzt die Gates (Toast-Race geschlossen, fünf
Welt-Features abgedeckt, `no-undef: error`, strikter Typecheck, Modul-zu-Test-Gate).

### What Worked

- **Die Reihenfolge Datensicherheit → Wartbarkeit → Gates hat sich bezahlt gemacht.** Das
  Coverage-Gate traf am Ende die endgültige Modulstruktur statt eine, die gerade aufgeteilt wurde.
- **Charakterisierungs-Snapshot vor der Aufteilung einfrieren (D-04).** `dmscreen-render.js` hatte
  1576 Zeilen, 21 Widgets und kein Testnetz. Der in Plan 13-05 eingefrorene 50-Snapshot-Test machte
  „verhaltensneutral" prüfbar statt behauptet — und fing nebenbei die Bedrohung T-13-50 (verlorener
  `esc()`-Aufruf in einem Widget-Renderer) strukturell ab.
- **Roter Vorlauf als Beweispflicht (D-02, Phase 14).** Der Toast-Race-Fix musste gegen den
  *ungefixten* Stand rot laufen, bevor der grüne Nachlauf zählte. Er war rot (5 von 95). Ohne diese
  Auflage wäre ein grüner Lauf als Beweis durchgegangen, der nichts bewiesen hätte.
- **`test.failing` als Anker für bestätigte, noch nicht behobene Defekte** (aus v1.2 Phase 12):
  die Suite bleibt grün, und sobald jemand den Bug behebt, meldet Jest den Test als unerwartet
  bestanden und erzwingt das Umstellen.

### What Was Inefficient

- **Zwei gebaute Dinge liefen nie.** Phase 14 baute eine korrekt kalibrierte Coverage-Ratsche, die
  in keiner Automatisierung ausgeführt wurde (`collectCoverage: false`, CI fuhr blankes `npm test`,
  `test:coverage` rief niemand). Erst der Milestone-Audit fand es. Dieselbe Klasse: Phase 13s
  `verify:post`-Schritt `secure-phase` lief für die Phase nie — die `13-SECURITY.md` entstand
  retroaktiv am Milestone-Ende.
- **Eine SUMMARY-Behauptung war schlicht falsch.** `14-06-SUMMARY.md` erklärte, alle sieben toten
  Aktionsziele „kommen nirgends mehr vor"; `populateImportNodesList` stand weiter in der Whitelist
  und ging in beide ausgelieferten Bundles. `no-undef` sieht es nicht, weil es ein String-Literal ist.
- **Aufteilung und Abdeckungs-Gate haben gegeneinander gearbeitet.** Phase 13 teilte Module
  ausdrücklich für Testbarkeit auf; Phase 14s Gate nahm 7 der 8 Ergebnisdateien sofort wieder aus.
  Ehrlich dokumentiert und ratschen-gesichert, aber der Nutzen der Aufteilung ist damit noch offen.
- **Ratschen als Prosa.** Alle drei Gate-Ratschen der Phase 14 sind Kommentare, keine Gates. Zwei
  haben sich während der Phase bereits gegen die eigene Vorschrift bewegt (17→8 Dateien, 78→86
  Ausnahmen), ohne dass etwas rot wurde.

### Patterns Established

- **„Gate existiert" ≠ „Gate läuft".** Die zweite Aussage steht in `.github/workflows/ci.yml`, nicht
  im SUMMARY. Bei jeder Gate-Phase zusätzlich prüfen, ob CI den Befehl tatsächlich fährt.
- **Verifikation gegen den Live-Baum, nicht gegen die Behauptung.** Beide Milestone-Funde kamen
  daher, dass Belege nachgefahren statt gelesen wurden.
- **Ausnahmeliste mit Datum als Ratsche** (`MODULE_TEST_EXCEPTIONS`) — macht eine bestehende Lücke
  sichtbar statt sie durch eine bedeutungslose globale Schwelle zu verdecken. Nützlich, solange die
  Liste nicht zur bequemen Ablage wird.
- **Vorab benannte Abweichung mit Abnahmebedingung** (D-10/PERF-01): der Konflikt mit dem
  Erfolgskriterium stand vor der Ausführung im CONTEXT, mit einer messbaren Bedingung. Die Messung
  erfüllte sie, die Freigabe ist mit `accepted_by`/`accepted_at` protokolliert — kein nachträgliches
  Zurechtbiegen.

### Key Lessons

1. Ein Gate, das nur läuft, wenn ein Mensch den Befehl tippt, ist kein Gate.
2. Ein Regressionsnetz muss **vor** der Umbaumaßnahme grün stehen, sonst ist es ein Nachweis über
   den Endzustand, nicht über die Verhaltensgleichheit.
3. Ein grüner Nachlauf ohne roten Vorlauf beweist nichts über einen Race-Fix.
4. `SUMMARY.md`-Coverage-Blöcke sind Selbstauskunft. Beim Audit ist ihr Wahrheitsgehalt die zu
   prüfende Frage, nicht die Prüfgrundlage.
5. Aufteilen für Testbarkeit ist erst eingelöst, wenn die entstandenen Dateien Tests bekommen.

### Cost Observations

- Modellmix: Orchestrierung Opus, Subagenten überwiegend Sonnet (Planer Opus, Checker/Auditoren Sonnet)
- Auffällig: der Milestone-Audit mit 26 parallelen Agenten fand zwei echte, ausgelieferte Defekte,
  die 38 Pläne und drei Phasen-Verifikationen passiert hatten — der teuerste Einzelschritt war der
  mit dem höchsten Ertrag.

## Cross-Milestone Trends

| Metrik | v1.0 | v1.1 | v1.2 |
|--------|------|------|------|
| Phasen / Pläne | 7 / 44 | 4 / 27 | 3 / 38 |
| Unit-Tests (Ende) | 453 | 628 | **1120** |
| E2E-Tests (Ende) | 231 | 319 | **323** |
| UAT-Szenarien | 20/20 | nicht erfasst | 35/35 (12: 28 · 13: 6 · 14: 1) |
| In UAT gefundene Bugs | 8+ | nicht erfasst | 4+ |
| Requirements | 31/31 | 6/6 | 19/19 |
| threats_open am Ende | — | 0 | 0 (171 Bedrohungen) |
| Vom Milestone-Audit gefundene Defekte | — | 2 | 2 |

> **Lücke:** Für v1.1 wurde nie ein Retrospektiv-Abschnitt geschrieben; die Spalte oben ist aus
> MILESTONES.md und dem v1.1-Archiv rekonstruiert, „nicht erfasst“ heißt genau das. Beim nächsten
> Milestone-Abschluss den Abschnitt direkt mitschreiben statt ihn nachzutragen.
