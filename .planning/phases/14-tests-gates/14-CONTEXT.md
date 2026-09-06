---
phase: 14
phase_name: Tests & Gates
slug: tests-gates
created: 2026-09-06
requirements: [TEST-03, TEST-04, TEST-05]
decisions_count: 15
mode: auto-recommendation (Nutzer: "Führe alle Bereiche nach deinen Empfehlungen aus", alle vier Bereiche gewählt)
---

# Phase 14 — Context: Tests & Gates

<domain>
## Phase Boundary

Die verbliebenen Testlücken sind geschlossen und die Qualitäts-Gates greifen scharf genug, um
künftige Rückschritte zu fangen.

**Drei Requirements, drei sehr verschiedene Arbeiten:**
- `TEST-03` — ein bekannter, lokalisierter Testinfrastruktur-Defekt (zwei Dateien)
- `TEST-04` — eine mechanische Umstrukturierung bestehender Tests (zwei Dateien → zehn)
- `TEST-05` — die eigentliche Substanz: drei Gates, von denen **zwei heute nachweislich nichts
  messen** und **eines seit dem 2026-09-05 rot ist**

**Nicht Teil dieser Phase:** neue Spielleiter-Funktionen (v1.2 ist ein Schulden-Milestone);
Testinhalte über das Verschieben hinaus erweitern (`TEST-04` verlangt dedizierte Dateien, nicht
mehr Tests); der Flächenumbau des `const X = window.X`-Zugriffsmusters (`v1.1-REQUIREMENTS.md`
§Out of Scope); dedizierte DM-Screen-Widget-Tests und das `console.*`-Strippen im Build-Schritt
(beides aus Phase 13 hierher weitergereicht, aber von keinem der drei Requirements gedeckt).

</domain>

<measured_baseline>
## Messwerte vom 2026-09-06 — Grundlage aller Entscheidungen unten

Alle Zahlen gegen den Live-Code nach Phase 13 erhoben, nicht aus `.planning/codebase/`
übernommen. Der Planer soll sie nachrechnen, nicht nachschlagen.

| Gegenstand | Messwert | Erhebung |
| --- | --- | --- |
| `npm run lint` | **Exit 1** — 1 Fehler, 2196 Warnungen | `npx eslint .` |
| Der eine Fehler | `systems/avatars.js:17` `no-control-regex`, eingeführt am 2026-09-05 durch `d2a521c` (WR-01, Phase 12) | `git log -S` |
| `no-undef`-Warnungen | 1829 Vorkommen / 539 eindeutige Namen | ESLint-JSON-Auswertung |
| davon Node-Globals (`global`, `require`, `__dirname`, `process`, …) | 516 Vorkommen / 6 Namen — reine Konfigurationslücke für `tests/**`, `tools/**` | Triage-Skript |
| davon Browser-Globals | 15 Vorkommen / 7 Namen — fehlen in der `globals`-Liste | Triage-Skript |
| davon echte projekteigene Globals | 1259 Vorkommen / 510 Namen — **alle** im Quellbaum deklariert | Triage-Skript |
| davon **nirgends deklariert** | 39 Vorkommen / 16 Namen — **darunter 6 tote Aktionsziele in Produktionscode** | Triage + `grep` je Name |
| `tsc --noEmit` heute | Exit 0 — prüft wegen `checkJs: false` faktisch kein JavaScript | `npx tsc --noEmit` |
| `tsc` mit `checkJs: true` | **1617 Fehler** (1268× TS2339 `window.X`/`D.X`, 240× TS2304, 25× TS2551 „did you mean", ~69 echte Typkonflikte); 98 von 103 geprüften Dateien betroffen | `npx tsc --checkJs …` |
| `jest --coverage` heute | instrumentiert **2 von 134 Modulen** (`utils/testable-utils.js` 153 Statements + `core/srd-monsters.js` 6) | `coverage/coverage-summary.json` |
| Ursache | `roots: ['<rootDir>/tests']` verhindert, dass Jest die in `collectCoverageFrom` gelisteten Quellverzeichnisse überhaupt durchsucht — die Konfiguration ist toter Buchstabe | `jest.config.cjs:6,45-58` |
| Ehrliche Coverage bei repariertem `roots` | **0,77 % Statements (147/18950)**, 0,92 % Functions (26/2816) | `jest --coverage --roots=.` |
| Warum so niedrig | **30 von 40** Unit-Testdateien laden Quelltext über `vm` + `readFileSync` — daran kommt Istanbul strukturell nicht heran; es gibt **keinen gemeinsamen Ladehelfer**, jede Datei baut ihren eigenen `vm`-Kontext | `grep` über `tests/unit/*.test.js` |
| Module ohne jede Testerwähnung | **75 von 134** aus `loader.js MODULES` (Basislinie, grobes Substring-Kriterium — exakt nachzuziehen) | Abbildungsskript gegen `loader.js` |
| Seed-Block `TEST-03` | in `party`/`npcs`/`quests` **byte-identisch**: je 61 Zeilen, md5 `6364cafedc46` | `diff` + `md5sum` |
| Angriffsfläche der Toast-Race | genau 2 Assertions: `locations.spec.js:80`, `encounters.spec.js:131-132` | `grep` |
| Sammel-Specs `TEST-04` | `welt-story.spec.js` 520 Z. / **26** Tests, `welt-story.test.js` 593 Z. / **37** Tests, je 5 `describe`-Blöcke gegen 3212 Z. Quellcode in 11 Modulen | `wc -l`, `jest`-Lauf |
| CI-Wiederholungen | `retries: process.env.CI ? 2 : 0` — verdeckt genau die Flake-Klasse aus Erfolgskriterium 1 | `playwright.config.js:31` |

</measured_baseline>

<decisions>
## Implementation Decisions

### Toast-Race schließen und beweisen (TEST-03)

- **D-01: Der Seed wandert als `seedCleanSession(page)` nach `tests/e2e/helpers/test-utils.js`; alle fünf CRUD-Specs rufen ihn auf. Keine fünfte Kopie.**
  Die drei bestehenden Blöcke sind **byte-identisch** — je 61 Zeilen, gleiche md5-Summe. Genau das
  macht die Extraktion risikoarm: der teure Teil einer Extraktion ist das Zusammenführen
  abweichender Varianten, und den gibt es hier nicht. Eine fünfte Kopie ergäbe 305 Zeilen
  dupliziertes Setup für zwei Assertions.
  Der 40-zeilige Ursachenkommentar aus Plan 08-02 **wandert mit** in den Helfer — er ist die
  einzige Stelle im Repo, die erklärt, *warum* geseedet wird (`initRandomTables()` und
  `validateDataIntegrity()` lösen früh nach dem Boot ein `save()` aus, dessen Backup-Toast den
  geteilten `#toast`-Knoten überschreibt). Ihn beim Extrahieren zu verlieren wäre der eigentliche
  Schaden.
  **⚠ Wortlaut-Abweichung von Erfolgskriterium 1, bewusst:** Dort steht, die beiden Specs „tragen
  den Seed-Nachzug aus Plan 08-02". Sie tragen künftig den *Aufruf*, nicht die Kopie. Sachlich
  identisch — hier benannt, damit die Verifikation es nicht als Lücke liest.
  — **Reversibility:** reversible — der Helfer ließe sich jederzeit wieder ausrollen.

- **D-02: Der Nachweis „auch unter Volllast nicht mehr reproduzierbar" läuft über einen protokollierten Wiederholungslauf mit abgeschalteten Retries — und über eine Falsifikationsprobe gegen den ungefixten Stand.**
  `npx playwright test tests/e2e/crud/locations.spec.js tests/e2e/crud/encounters.spec.js
  --repeat-each=N --workers=<hoch> --retries=0`. Die `--retries=0` sind nicht optional: mit den
  CI-üblichen zwei Wiederholungen kann ein Flake den Lauf nicht mehr rot machen, und der Beweis
  wäre keiner.
  **Der Vorlauf gegen den ungefixten Stand ist Pflicht.** Reproduziert derselbe Lauf die Race
  vorher *nicht*, beweist der grüne Nachlauf nichts über den Fix — dann ist die Last zu erhöhen
  oder das Verfahren zu wechseln, bevor abgenommen wird. Das ist die direkte Anwendung des
  wiederkehrenden Projektbefunds „ein grüner Test ist kein Beweis" (`08-LEARNINGS.md`,
  `11-LEARNINGS.md`) und folgt dem Muster von `13-PERF-MEASUREMENT.md`: Messprotokoll als Artefakt,
  nicht als Behauptung im Summary.

- **D-03 — `retries: 2` in `playwright.config.js` bleibt unverändert.**
  Der Reflex, Retries abzuschalten, damit Flakes sichtbar werden, geht hier fehl: die Retries sind
  nicht der Defekt, der fehlende Seed ist es. Sie auf 0 zu setzen macht jede
  Infrastruktur-Schluckauf-Minute auf `main` rot, ohne eine einzige echte Race zu schließen.
  Retries werden **nur im Beweislauf aus D-02** abgeschaltet, punktuell und per Kommandozeile.

### Zuschnitt der Welt-Testdateien (TEST-04)

- **D-04: Beide Sammeldateien werden aufgeteilt — 2 Dateien → 10.**
  Erfolgskriterium 2 spricht von „einer gemeinsamen Sammel-Spec" im Singular, `DEBT-28`
  (`v1.1-REQUIREMENTS.md:134`) nennt aber ausdrücklich **beide**:
  `tests/unit/welt-story.test.js` *und* `tests/e2e/features/welt-story.spec.js`. Nur die E2E-Hälfte
  zu teilen ließe mit `welt-story.test.js` (593 Zeilen, fünf Domänen) genau das stehen, worüber das
  Requirement klagt.
  **Zielnamen nach dem Quellverzeichnis, nicht nach den `WELT-NN`-Codes:**
  `tests/e2e/features/{session-prep,npc-generator,timeline,reise,fraktionen}.spec.js` und
  `tests/unit/{session-prep,npc-generator,timeline,reise,fraktionen}.test.js`. Die `WELT-NN`-Codes
  sind Planungsartefakte aus Phase 5 und sagen niemandem etwas, der den Testbaum liest;
  `features/session-prep/` → `session-prep.test.js` ist die Zuordnung, die man ohne Nachschlagen
  versteht.

- **D-05: Die Aufteilung ist mechanisch und verhaltensneutral. Kein Test wird verändert, keiner hinzugefügt.**
  Beide Dateien sind aus Phase-5-„Wave-0"-Stubs gewachsen; jeder der fünf `describe`-Blöcke trägt
  sein **eigenes lokales Setup** (`makeMockD()` und die `global.*`-Stubs im Unit-Test, eigene
  `beforeEach` im E2E-Teil). Die Blöcke sind damit in sich geschlossen — das Verschieben braucht
  keine Zusammenführung.
  **Abnahmekriterium binär:** Testzahl vorher = Testzahl nachher, **26 E2E** und **37 Unit**, beide
  Summen über die je fünf neuen Dateien.
  Die Abdeckungslücken gegen die 3212 Quellzeilen zu schließen wäre eine ungleich größere Arbeit
  ohne Grenze im Requirement — `TEST-04` verlangt dedizierte Dateien, nicht mehr Tests. Verschoben
  (siehe `<deferred>`). Das spiegelt Phase 13 D-02/`MAINT-01`: entlang der vorhandenen Struktur
  schneiden, Neutralität beweisen, beim Verschieben nichts verbessern.

- **D-06: Beim Verschieben wird `welt-story.spec.js`s eigenes `APP_URL` NICHT auf den gemeinsamen `loadApp()`-Helfer umgestellt.**
  Die Datei baut ihre `file://`-URL selbst, statt `loadApp()` zu nutzen. `loadApp()` macht mehr als
  ein `goto`: `waitForSelector('.app-title')` plus 500 ms Nachlauf (`test-utils.js:11-17`). Der
  Wechsel wäre eine Timing-Änderung — also genau die Verhaltensänderung, die D-05 ausschließt.
  Die Inkonsistenz ist real und notiert (siehe `<deferred>`), gehört aber in einen eigenen Schritt
  mit eigenem Nachweis.

### Lint schärfen (TEST-05)

- **D-07: Der rote Fehler zuerst, als eigene erste Aufgabe — gezielter Disable mit Begründung, keine projektweite Regelabschaltung.**
  `systems/avatars.js:17` verwendet `[\x00-\x20\x7F\s]` **absichtlich**: der Steuerzeichen-Strip
  ist der Kern des Security-Fixes WR-01 aus Phase 12 (`d2a521c`, 2026-09-05), der
  `java\tscript:`-Umgehungen der Protokollprüfung schließt. Die Regel `no-control-regex` hat hier
  einen Fehlalarm; sie global abzuschalten nähme sie überall sonst weg.
  → `// eslint-disable-next-line no-control-regex` mit einer Zeile Begründung und Verweis auf
  WR-01.
  **Vorrang:** Seit dem 2026-09-05 bricht `npm run lint` mit Exit 1 ab. Der CI-Job
  `lint-and-typecheck` ist damit rot, und `e2e`, `build`, `smoke-test` und `deploy` hängen per
  `needs:` daran. Jede andere Gate-Arbeit dieser Phase läuft in einer Pipeline, die vorher nicht
  durchläuft.

- **D-08: `no-undef` wird auf `error` gehoben — aber erst, nachdem die Globals-Liste aus dem Quellbaum generiert statt handgepflegt wird.**
  Die Triage zeigt, dass die 1829 Warnungen keine 1829 Probleme sind: 516 davon sind fehlende
  Node-Globals in `tests/**`/`tools/**`, 15 fehlende Browser-Globals, 1259 die projekteigenen
  Cross-Modul-Globals der Non-ESM-Architektur — die sind kein Defekt, sondern das Zugriffsmuster.
  510 Namen von Hand in `eslint.config.js` zu pflegen (heute stehen dort ~25) würde binnen einer
  Phase verrotten: allein Phase 13 hat beim Aufteilen von vier Modulen 14 neue Dateien und
  dutzende verschobene Funktionen erzeugt.
  → Ein Generator leitet die deklarierten Top-Level-Namen aus den in `loader.js MODULES` gelisteten
  Dateien ab (Single Source of Truth, ARCH-01) und schreibt sie in ein eingecheckten Artefakt, das
  `eslint.config.js` einliest; ein Test schlägt fehl, sobald das Artefakt gegenüber dem Quellbaum
  veraltet ist. **Das Verfahren ist im Projekt etabliert, nicht neu:**
  `tests/unit/console-hygiene.test.js` leitet seinen Dateisatz bereits aus `loader.js MODULES` ab
  (13-08), und `tests/unit/tab-registry.test.js` gewinnt Bezeichner aus dem Quelltext (13-04).
  — **Reversibility:** costly — der Rückweg auf `warn` ist trivial, aber der Generator und sein
  Stale-Test wären dann totes Beiwerk, und die 6 Funde aus D-09 fielen wieder unter den Tisch.

- **D-09: Die von D-08 freigelegten toten Aktionsziele werden in dieser Phase behoben, nicht nur gemeldet.**
  Nach Abzug von Node-, Browser- und projekteigenen Globals bleiben 16 Namen. Sechs davon sind
  **tote Ziele in Produktionscode** — jeder existiert im gesamten Repo genau an seiner
  Registrierungs- bzw. Aufrufstelle und nirgends sonst:

  | Fundstelle | Ziel |
  | --- | --- |
  | `ui/actions/entity-actions.js:238` | `'scroll-to-npc'` → `scrollToNPC` |
  | `ui/actions/entity-actions.js:420` | `'remove-loot-tag'` → `removeLootTag` |
  | `ui/actions/entity-actions.js:473` | `'populate-import-nodes'` → `populateImportNodesList` |
  | `ui/actions/system-actions.js:14` | `'export-csv'` → `exportDataCSV` |
  | `ui/actions/system-actions.js:167` | direkter Aufruf `showErrorLogModal()` |
  | `ui/actions/ui-actions.js:22` | `'set-view-mode'` → `setViewMode` |

  Dazu `core/init.js:106` `initLootTagSystem` — ebenfalls tot, aber durch
  `typeof … === 'function'` abgesichert und damit harmlos.
  Das ist exakt die `MAINT-05`-Fehlerklasse, die Phase 13 in ihrer Tab-Registry-Variante geschlossen
  hat: eine Referenz über einen Namen, den es nicht mehr gibt, die nur zur Laufzeit auffällt.
  `action-registry-collisions.test.js` fängt sie nicht — es prüft Kollisionen, nicht Existenz.
  **Entscheidungsregel je Fundstelle für den Planer:** Verweist kein `data-action` in
  `assets/templates/**` auf die Aktion, wird die Registrierung entfernt. Verweist eines darauf, ist
  es ein echter Bedienfehler und die Funktion fehlt — dann ist das ein Befund, kein Aufräumposten.
  **Ohne D-09 ist D-08 nicht erreichbar:** solange diese Namen offen sind, kann `no-undef` nicht auf
  `error`.

- **D-10 — `--max-warnings` wird als Ratsche auf den gemessenen Reststand gesetzt, nicht auf 0. `lint:all` mit `--max-warnings 100` entfällt.**
  Nach D-07/D-08 bleiben im Wesentlichen 336 `no-unused-vars` plus ~31 kleinere Treffer. Diese 336
  auf 0 zu drücken hieße, am `const X = window.X`-Importmuster zu arbeiten — dem Muster, das Phase
  13 D-14 ausdrücklich als Projektstandard schützt (169 Vorkommen allein für `const D = window.D`)
  und das `v1.1-REQUIREMENTS.md` §Out of Scope vom Flächenumbau ausnimmt.
  → Härte kommt über `no-undef: error` (Toleranz 0, wo es zählt), Trend über eine gepinnte
  Warnungszahl, die nur fallen darf. Der zweite Befehl `lint:all` mit einer davon abweichenden
  Grenze ist danach eine zweite Wahrheit über denselben Sachverhalt und fällt weg — dieselbe
  Begründung wie ARCH-01 für Modullisten.

### Typecheck (TEST-05)

- **D-11: `checkJs` bleibt global aus. Geschärft wird über eine zweite, wachsende Zulassungsliste — und der Rest von `DEBT-01`s tsconfig-Hälfte bleibt offen und benannt.**
  Gemessen statt vermutet: `checkJs: true` erzeugt **1617 Fehler** in 98 von 103 geprüften Dateien,
  selbst mit `strict: false` und `noImplicitAny: false`. Davon sind **1268 TS2339**
  („Property does not exist") — das ist keine Fehlerklasse, sondern das `window.X`/`D.X`-
  Zugriffsmuster dieser Architektur, dessen Umbau ausdrücklich außerhalb liegt. Weitere **240 TS2304**
  („Cannot find name") sind derselbe Sachverhalt, den D-08 eine Ebene tiefer bereits zum harten
  Fehler macht — dort mit einer Liste, die sich generieren lässt, hier ohne. Der echte Restertrag
  von `checkJs` sind ~25 TS2551-Tippfehlerkandidaten und ~69 Typkonflikte, begraben unter 1508
  Treffern architektonischen Rauschens.
  → `tsconfig.json` bleibt wie es ist. Daneben ein `tsconfig.strict.json` mit `checkJs: true` und
  einer expliziten `include`-Zulassungsliste, die mit den heute fehlerfreien Dateien startet und nur
  wachsen darf; ein eigener npm-Befehl fährt ihn, die CI hängt ihn an `lint-and-typecheck`.
  **⚠ Konflikt mit Erfolgskriterium 3, bewusst und benannt.** Dort steht, die Gates seien „geschärft
  und laufen grün". Für Lint (D-07/D-08/D-10) und Coverage (D-12/D-13) gilt das voll. Für Typecheck
  gilt es nur für die Zulassungsliste; `checkJs` bleibt für ~98 % des Quellbaums aus. Das ist die
  ehrliche Abnahme: `DEBT-01` wird zu zwei Dritteln geschlossen, das letzte Drittel bleibt mit
  Messwert (1617/1268/240) als benannter Restposten stehen, statt als erledigt zu gelten. Die
  Alternative wäre, `strict`/`checkJs` zu setzen und die Fehler wegzukonfigurieren — ein Gate, das
  grün ist, weil es nichts prüft, ist genau der Zustand, aus dem diese Phase herausführen soll.

### Coverage (TEST-05)

- **D-12: `roots` wird repariert, damit `collectCoverageFrom` überhaupt greift — und die ehrliche Zahl wird dokumentiert, nicht kaschiert.**
  `jest.config.cjs` listet in `collectCoverageFrom` fünf Quellverzeichnisse, aber
  `roots: ['<rootDir>/tests']` verhindert, dass Jest sie durchsucht. Instrumentiert werden dadurch
  **2 von 134 Modulen**; die Kopfzahl „92,45 %" bezieht sich auf 159 Statements. Mit repariertem
  `roots` lautet die Zahl **0,77 % (147/18950)**.
  Diese 0,77 % sind das Ergebnis, nicht das Problem — sie stimmen. Sie kommen in den
  Phasen-Nachweis.

- **D-13: Keine globale Statement-Schwelle. Das schärfere Coverage-Gate ist ein Modul-zu-Test-Abdeckungs-Gate, abgeleitet aus `loader.js MODULES`, mit datierter Ausnahmeliste als Ratsche.**
  Statement-Coverage ist in dieser Architektur nicht die Stellschraube, die sie anderswo ist:
  **30 von 40** Unit-Testdateien laden Quelltext über `vm` + `readFileSync`, woran Istanbul
  strukturell nicht herankommt, und es gibt **keinen gemeinsamen Ladehelfer** — jede Datei baut
  ihren eigenen Kontext, eine Instrumentierung müsste also zuerst 30 Aufrufstellen vereinheitlichen.
  Erschwerend: ein erheblicher Teil dieser `readFileSync`-Aufrufe lädt gar kein Modul, sondern
  prüft **Quelltext als Text** (`console-hygiene`, der Deklarations-Wächter in `tab-registry`,
  `sanitizer-parity`, `action-registry-collisions`). Für solche Tests ist Statement-Coverage
  kategorial die falsche Messgröße — sie können per Konstruktion keine erzeugen.
  → Stattdessen ein Jest-Test, der die Modulliste aus `loader.js MODULES` liest und verlangt, dass
  jedes Modul von mindestens einer Testdatei angefasst wird. Basislinie heute: **75 von 134 Modulen
  ohne jede Testerwähnung** — die kommen als explizite, datierte Ausnahmeliste in den Test, und der
  Test schlägt fehl, sobald ein **neues** Modul ohne Test dazukommt oder die Liste wächst.
  Das ist die maschinenprüfbare Form von `TEST-04`: die elf Welt-Module stehen heute auf dieser
  Liste und verlassen sie durch D-04/D-05 (75 → 64). Das Muster (`loader.js` als Quelle, Test bricht
  bei Drift) ist dasselbe wie in 13-08 und 13-04.
  **Für den Planer:** Die 75 sind eine Basislinie mit grobem Substring-Kriterium. Das Kriterium ist
  vor dem Festschreiben zu präzisieren und die Zahl neu zu erheben — eine Ausnahmeliste, die zu groß
  ist, weil das Kriterium zu streng war, entwertet das Gate von Tag eins an.
  — **Reversibility:** costly — die Ausnahmeliste ist ein eingecheckter Vertrag; sie später durch
  eine andere Messgröße zu ersetzen hieße, sie und alle daran gewachsenen Erwartungen aufzugeben.

- **D-14: Die bestehende Schwelle für `utils/testable-utils.js` bleibt und wird auf den gemessenen Stand angehoben.**
  Heute 80 % bei tatsächlich 92,81 % Statements — die Schwelle liegt also 13 Punkte unter der
  Wirklichkeit und kann nicht einmal einen Rückschritt fangen. Sie wird knapp unter die gemessenen
  Werte gesetzt (Statements/Branches/Functions/Lines je einzeln, Zahlen vom Planer frisch erheben)
  und wirkt damit als Ratsche für die einzige Datei, für die Statement-Coverage hier überhaupt
  aussagekräftig ist.

### Reihenfolge

- **D-15: `TEST-05` beginnt mit D-07 und endet mit D-13; `TEST-04` läuft dazwischen, `TEST-03` kann parallel.**
  Zwingend ist nur der Anfang und ein Ende: D-07 zuerst, weil sonst die gesamte CI-Kette nicht
  durchläuft und kein anderes Gate verifizierbar ist. Das Modul-zu-Test-Gate aus D-13 zuletzt,
  weil `TEST-04` seine Basislinie um elf Module verschiebt — es vorher festzuschreiben hieße, die
  Liste im selben Milestone zweimal zu setzen. Der Auslegungshinweis der Roadmap („`TEST-05` kommt
  bewusst zuletzt") gilt damit für die Coverage-Hälfte; für den roten Lint-Fehler gilt das
  Gegenteil, und der Widerspruch ist hier aufgelöst statt später im Plan.

### Claude's Discretion

Der Nutzer hat alle vier Bereiche gewählt und die Entscheidungen delegiert („Führe alle Bereiche
nach deinen Empfehlungen aus") — dieselbe Vorgabe wie in Phase 13. Sämtliche D-01…D-15 sind daher
Empfehlungsentscheidungen, nach Projektkonvention und gegen den gemessenen Live-Stand getroffen und
hier festgehalten, damit der Planer sie nicht neu wählt.

**Drei Empfehlungen weichen von der Roadmap-Erwartung ab und sind oben mit Beleg begründet:**
- D-01 — Erfolgskriterium 1 legt einen Seed-*Nachzug* nahe; empfohlen ist die Extraktion.
- D-04 — Erfolgskriterium 2 spricht von *einer* Sammel-Spec; es sind zwei.
- D-11 — Erfolgskriterium 3 verlangt drei geschärfte, grüne Gates; für Typecheck wird das
  nur für eine Zulassungsliste erreicht, mit benanntem Restposten statt stiller Abnahme.

**Ein Befund, der so nicht erwartet war:** `npm run lint` ist seit dem 2026-09-05 rot. Das ist
keine Schärfung, sondern eine offene Regression aus Phase 12, und sie blockiert per `needs:` die
Jobs `e2e`, `build`, `smoke-test` und `deploy`. Sie gehört an den Anfang der Phase (D-07).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Anforderungen und Belege
- `.planning/REQUIREMENTS.md` §Tests & Gates — `TEST-03`, `TEST-04`, `TEST-05` mit
  Datei-/Zeilenbelegen und der Begründung, warum `TEST-05` zuletzt steht
- `.planning/ROADMAP.md` §Phase 14 — Erfolgskriterien 1–3 und der **Auslegungshinweis** zu
  `TEST-05`
- `.planning/milestones/v1.1-phases/11-architektur-build-hygiene/11-CONCERNS-TRIAGE.md` —
  Live-Code-Beleg je `DEBT`-Posten: Eintrag **S4** (`DEBT-15`, Toast-Race, Zeile 86), Eintrag
  **N16** (`DEBT-28`, fehlende Welt-Testdateien, Zeile 239), Einträge **4 / 29 / 43** (`DEBT-01`,
  tsconfig / eslint / coverageThreshold, Zeilen 36 / 96 / 130)
- `.planning/milestones/v1.1-REQUIREMENTS.md:98,134` — ungekürzte Beschreibungen von `DEBT-01` und
  `DEBT-28`; **`DEBT-28` nennt beide Sammeldateien** (Grundlage für D-04)
- `.planning/milestones/v1.1-REQUIREMENTS.md` §Out of Scope — der ausgeschlossene Flächenumbau des
  `const X = window.X`-Musters (Grundlage für D-10 und D-11)

### Herkunft des Toast-Race-Seeds
- `.planning/milestones/v1.1-phases/08-test-fundament-gr-n/08-02-PLAN.md` und
  `08-02-SUMMARY.md` — der Seed-Nachzug, der `locations`/`encounters` fehlt (D-01)
- `.planning/milestones/v1.1-phases/08-test-fundament-gr-n/08-RESEARCH.md` §Pitfall 4 — die
  Ursachenanalyse, auf die der 61-zeilige Kommentar verweist
- `.planning/milestones/v1.1-phases/08-test-fundament-gr-n/08-LEARNINGS.md` und
  `.planning/milestones/v1.1-phases/11-architektur-build-hygiene/11-LEARNINGS.md` — „ein grüner
  Test ist kein Beweis"; direkte Begründung für die Falsifikationsprobe in D-02

### Projektregeln, die diese Phase bindet
- `CLAUDE.md` §Gotchas Nr. 1 (ARCH-01) — `loader.js MODULES` ist die einzige Modulliste; Grundlage
  für den Globals-Generator (D-08) und das Abdeckungs-Gate (D-13)
- `CLAUDE.md` §Tab Navigation Architecture → *MAINT-02 (Plan 13-04)* — wie Phase 13 dieselbe
  Fehlerklasse (Referenz auf einen Namen, den es nicht gibt) test-erzwingbar gemacht hat; Vorbild
  für D-08/D-09
- `CLAUDE.md` §Testing und §Debugging Checklist — Testbefehle und die Regeln für neue
  Renderfunktionen
- `CLAUDE.md` §Build System & Deduplication — warum `build.py` die Listen liest statt sie zu führen

### Vorentscheidungen aus Phase 13
- `.planning/phases/13-h-rtung-wartbarkeit/13-CONTEXT.md` — D-01 (800-Zeilen-Norm, gilt auch für
  neue Testdateien), D-14/`MAINT-02` (das `const X = window.X`-Muster ist Projektstandard, nicht
  Defekt — Grundlage für D-10), sowie die **Deferred Ideas**, die auf Phase 14 zeigen
- `.planning/phases/13-h-rtung-wartbarkeit/13-PERF-MEASUREMENT.md` — Form des Messprotokolls, dem
  D-02 folgt
- `.planning/phases/13-h-rtung-wartbarkeit/13-LEARNINGS.md` — Muster aus zwölf Plänen mit vollem
  Suiten-Gate; insbesondere die wiederkehrende „Stale-Count"-Erfahrung (Planzahlen stimmten dreimal
  nicht mit dem Live-Stand überein) — Grund, warum alle Zahlen in `<measured_baseline>` frisch
  erhoben und vom Planer nachzurechnen sind

### Konfiguration, die geändert wird
- `eslint.config.js` — `globals`-Block (~25 App-Globals heute), `no-undef: 'warn'` (Zeile ~102)
- `package.json` §scripts — `lint`, `lint:all`, `typecheck`, `test:coverage`, `check`
- `jest.config.cjs:6` (`roots`), `:45-58` (`collectCoverageFrom`), `:65-72` (`coverageThreshold`)
- `tsconfig.json:11,21` — `allowJs`/`checkJs: false`, `strict: false`
- `playwright.config.js:31` — `retries`
- `.github/workflows/ci.yml` — Job `lint-and-typecheck` und die `needs:`-Kette dahinter

### Betroffene Test- und Quelldateien
- `tests/e2e/crud/locations.spec.js`, `encounters.spec.js` — die zwei ohne Seed
- `tests/e2e/crud/party.spec.js`, `npcs.spec.js`, `quests.spec.js` — die drei byte-identischen
  Vorlagen
- `tests/e2e/helpers/test-utils.js` — Ziel der Extraktion (D-01)
- `tests/e2e/features/welt-story.spec.js`, `tests/unit/welt-story.test.js` — die zwei Sammeldateien
- `tests/unit/console-hygiene.test.js`, `tests/unit/tab-registry.test.js` — die Vorlagen für
  „aus `loader.js` abgeleitet, bricht bei Drift"
- `systems/avatars.js:17` — der rote Lint-Fehler
- `ui/actions/entity-actions.js`, `ui/actions/system-actions.js`, `ui/actions/ui-actions.js`,
  `core/init.js` — die sieben toten Ziele aus D-09

**Keine externen ADRs oder Specs — dieses Projekt führt keine.**

</canonical_refs>

<code_context>
## Existing Code Insights

### Wiederverwendbare Bausteine
- **`tests/e2e/helpers/test-utils.js`** (22 exportierte Helfer: `loadApp`, `navigateToTab`,
  `fillField`, `waitForToast`, `performUndo`, `testData`, …) — der etablierte Ort für den Seed aus
  D-01, mit vorhandener Namenskonvention (englische Funktionsnamen, deutsche Kommentare).
- **`tests/unit/console-hygiene.test.js`** (13-08) — leitet seinen Dateisatz aus `loader.js MODULES`
  ab und bricht bei Drift. Direkte Vorlage für den Globals-Generator (D-08) und das
  Abdeckungs-Gate (D-13); es muss kein Verfahren erfunden werden.
- **`tests/unit/tab-registry.test.js`** (13-04) — statischer Deklarations-Wächter, der Bezeichner
  aus dem Quelltext gewinnt statt aus einer Parallelliste. Dasselbe Prinzip wie D-08.
- **`.planning/phases/13-h-rtung-wartbarkeit/13-PERF-MEASUREMENT.md`** — Form des Messprotokolls für
  D-02.

### Etablierte Muster, die den Rahmen setzen
- **Non-ESM, globaler Geltungsbereich** — der Grund für 1259 legitime `no-undef`-Treffer und für
  1268 TS2339. Kein Defekt, sondern die Architektur; beide Gates müssen sich daran anpassen, nicht
  umgekehrt.
- **`vm` + `readFileSync` als Ladeverfahren in 30 von 40 Unit-Tests, ohne gemeinsamen Helfer** —
  die harte Grenze für Statement-Coverage (D-13).
- **Quelltext-als-Text-Tests** (`console-hygiene`, `sanitizer-parity`, `action-registry-collisions`,
  Deklarations-Wächter) — eine Testgattung, die per Konstruktion keine Statement-Coverage erzeugt.
- **`loader.js MODULES` als Single Source of Truth (ARCH-01)** — `build.py` liest daraus und bricht
  bei fehlender Datei ab; dieselbe Liste trägt D-08 und D-13.
- **Deutsche Testnamen, `// ====`-Sektionsbanner in Testdateien** — beim Aufteilen (D-04/D-05)
  beizubehalten.

### Integrationspunkte
- **`.github/workflows/ci.yml` Job `lint-and-typecheck`** — Kopf der `needs:`-Kette; alles, was
  diese Phase schärft, wird dort erzwungen. Neue Befehle (strict-Typecheck aus D-11) hängen hier an.
- **`jest.config.cjs` `roots`** — eine einzige Zeile mit Doppelwirkung: sie steuert die
  Testerkennung **und** blockiert `collectCoverageFrom`. Änderungen daran erst gegen einen vollen
  Jest-Lauf prüfen (heute: 43 Suiten, 1109 Tests).
- **`assets/templates/**`** — hier steht, ob eine der sechs toten Aktionen aus D-09 noch eine
  Bedienfläche hat; das entscheidet zwischen „Registrierung entfernen" und „echter Bedienfehler".
- **`eslint.config.js` Konfigurationsblöcke** — der Block für `tests/**` schaltet `no-unused-vars`
  bereits ab; der Node-Globals-Nachtrag aus D-08 gehört genau dorthin und in einen neuen Block für
  `tools/**`.

</code_context>

<specifics>
## Specific Ideas

- **Der Nutzer hat die Entscheidungen delegiert, nicht die Sorgfalt.** Vorgabe wie in Phase 13:
  alle Bereiche nach Empfehlung entscheiden. Entsprechend sind alle Empfehlungen gegen den Live-Code
  gemessen — die drei Stellen, an denen eine Empfehlung ohne Zahl nur eine Meinung gewesen wäre
  (Lint-Triage, `checkJs`-Fehlerzahl, Coverage bei repariertem `roots`), sind in
  `<measured_baseline>` belegt.
- **Zwei der drei Gates messen heute nachweislich nichts, und das dritte ist rot.** Das ist die
  eigentliche Nachricht dieser Phase: `TEST-05` ist nicht „Schwellenwerte anheben", sondern
  „Gates, die grün sind, weil sie nichts prüfen, durch Gates ersetzen, die etwas prüfen können".
  Die 0,77 % und die 1617 sind keine Peinlichkeiten, sondern die Messwerte, an denen die Phase
  ihren Fortschritt festmacht.
- **Die Phase liefert nebenbei echte Bugfunde.** Sechs tote Aktionsziele (D-09) sind kein
  Aufräumen, sondern Fehler, die beim Klicken eine `ReferenceError` werfen. Sie sind erst durch die
  Gate-Triage sichtbar geworden — der beste verfügbare Beleg, dass die Schärfung sich rechnet.

</specifics>

<deferred>
## Deferred Ideas

- **Abdeckungslücken der fünf Welt-Features schließen** — `TEST-04` verlangt dedizierte Dateien
  (D-04/D-05), nicht mehr Tests. 26 E2E- und 37 Unit-Tests gegen 3212 Quellzeilen in 11 Modulen ist
  dünn; nach der Aufteilung ist je Feature sichtbar, wie dünn. Eigener Posten, sobald das
  Abdeckungs-Gate aus D-13 steht und die Zahlen je Modul zeigt.
- **`welt-story.spec.js`s eigenes `APP_URL` auf `loadApp()` vereinheitlichen** — per D-06 aus der
  mechanischen Aufteilung herausgehalten, weil es eine Timing-Änderung wäre. Eigener Schritt mit
  eigenem Nachweis.
- **`vm`-Ladepfad instrumentierbar machen** — ein gemeinsamer Ladehelfer für die 30 handgerollten
  `vm.createContext`-Stellen plus `babel-plugin-istanbul` vor `runInContext` wäre der einzige Weg
  zu aussagekräftiger Statement-Coverage. Ein eigenes Testinfrastruktur-Vorhaben; in derselben
  Phase auszuführen, die zehn neue Testdateien anlegt, wäre eine unnötige Kollision.
- **`checkJs` über die Zulassungsliste hinaus ausrollen** — braucht zuerst eine Typdeklaration für
  die `window`-Oberfläche und für `D` (`core/data.js`), sonst bleiben die 1268 TS2339 stehen. Der
  Globals-Generator aus D-08 wäre die halbe Vorarbeit; die zweite Hälfte (ein echtes `D`-Interface
  statt `any`) ist ein eigenes Vorhaben.
- **`tests/unit/markdown-converter.test.js` enthält Platzhalter-Assertions**, die ohne Aufruf der
  Produktionsfunktion durchlaufen (`// Would call htmlToMarkdown(html)`, dokumentiert in
  `.planning/codebase/TESTING.md` §Known caveats). Ein grüner Test, der nichts beweist — dieselbe
  Klasse wie die Gates dieser Phase, aber von keinem der drei Requirements gedeckt.
- **Dedizierte DM-Screen-Widget-Tests** (Interaktion, Profile, Live-Sync) — aus Phase 13 (D-04)
  hierher weitergereicht; der Charakterisierungs-Snapshot aus 13-05 ist nur das Minimum, das die
  Aufteilung absichert. Von `TEST-04` nicht gedeckt.
- **`console.*` per Build-Schritt strippen statt per Quellcode-Guard** — aus Phase 13 mit dem
  Vermerk „passt besser zu Phase 14 oder später" übergeben. `MAINT-06` ist geschlossen; eine
  Build-System-Änderung mit eigenem TDD-Aufwand (`tests/build/`) ist von `TEST-05` nicht verlangt.
- **`retries: 0` als nächtlicher Lauf** — D-03 lässt die CI-Retries stehen. Ein separater,
  nicht-blockierender Lauf ohne Retries wäre der Weg, Flakes dauerhaft sichtbar zu machen, ohne
  `main` an Infrastruktur-Zufällen scheitern zu lassen.

</deferred>

---

*Phase: 14-Tests & Gates*
*Context gathered: 2026-09-06*
