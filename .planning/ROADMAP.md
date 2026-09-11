# Roadmap: D&D Kampagnen-Tracker Pro

## Milestones

- ✅ **v1.0 Stabilisierung & Ausbau** — Phasen 1–7 (shipped 2026-07-22) → [Archiv](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Tech-Debt & Härtung** — Phasen 8–11 (shipped 2026-07-27) → [Archiv](milestones/v1.1-ROADMAP.md)
- ✅ **v1.2 Schulden-Abbau** — Phasen 12–14 (shipped 2026-09-07) → [Archiv](milestones/v1.2-ROADMAP.md)
- 🔧 **Zwischenarbeit** — zwei Design-Handoffs nach v1.2, 29 Commits ausserhalb des GSD-Ablaufs (2026-09-07). Editor-Werkzeugleisten auf eine Quelle, Design-Konsistenz F-01..F-19. Details in [PROJECT.md](PROJECT.md#zwischenarbeit-nach-v12-2026-09-07-29-commits-ausserhalb-des-gsd-ablaufs)
- 🚧 **v1.3 Design-System** — Phasen 15–19 (in progress)

## Phases

<details>
<summary>✅ v1.0 Stabilisierung & Ausbau (Phasen 1–7) — SHIPPED 2026-07-22</summary>

- [x] Phase 1: Stabilisierung (9/9 Pläne) — App startet, Daten sind sicher, CI erkennt Crashes
- [x] Phase 2: Technik-Fundament (5/5 Pläne) — Installierbare PWA, Datei-Backup, Migrations-Wizard (completed 2026-06-12)
- [x] Phase 3: Bestiary (5/5 Pläne) — 112 SRD-Monster offline + eigene Kreaturen + Encounter-Import (completed 2026-06-13)
- [x] Phase 4: Initiative-Erweiterungen (4/4 Pläne) — Statblock-Popup, Legendäre Aktionen, Mob-Modus (completed 2026-06-13)
- [x] Phase 5: Welt & Story (8/8 Pläne) — Session-Prep, NPC-Generator, Kalender, Reise, Fraktionen (completed 2026-06-18)
- [x] Phase 6: Spieler-Verwaltung (9/9 Pläne) — XP/Milestone-Tracker, Inspiration, Charakterwerte (completed 2026-06-18)
- [x] Phase 7: Komfort & Analyse (4/4 Pläne) — Soundboard, Würfel-Statistiken (completed 2026-06-20)

Details, Success Criteria und Coverage: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

<details>
<summary>✅ v1.1 Tech-Debt & Härtung (Phasen 8–11) — SHIPPED 2026-07-27</summary>

- [x] Phase 8: Test-Fundament grün (4/4 Pläne) — 11 vorbestehende E2E-Fails behoben, `e2e` als blockierendes CI-Gate (completed 2026-07-23)
- [x] Phase 9: Editor-Regressionsnetz & execCommand-Ablösung (9/9 Pläne) — Rich-Text auf Selection/Range migriert, 79-Test-Netz stand VOR der Migration (completed 2026-07-25)
- [x] Phase 10: Security-Härtung (7/7 Pläne) — Import-XSS behoben, Sanitizer-Tests gegen den Produktionsquelltext, `threats_open: 0` (completed 2026-07-25)
- [x] Phase 11: Architektur- & Build-Hygiene (7/7 Pläne) — Modullisten-Drift strukturell unmöglich, Dedup-Pass 3 entfernt, CI deprecation-frei (completed 2026-07-27)

Tests: Jest 457 → 628 · Playwright 231 → 319 · pytest 10 → 24. Nyquist 4/4 compliant.

Details, Success Criteria und Nachbetrachtung: [milestones/v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md)
Audit: [v1.1-MILESTONE-AUDIT.md](v1.1-MILESTONE-AUDIT.md) · Übertrag nach v1.2: [milestones/v1.1-REQUIREMENTS.md](milestones/v1.1-REQUIREMENTS.md)

</details>

<details>
<summary>✅ v1.2 Schulden-Abbau (Phasen 12–14) — SHIPPED 2026-09-07</summary>

**Ziel war:** die 26 in der v1.1-Triage erfassten `DEBT`-Posten abarbeiten, damit der Backlog leer ist
und v1.3 wieder Features bringen kann. **Erreicht** — 19 Requirements, alle validiert.

- [x] Phase 12: Datensicherheit (17/17 Pläne) — Umzugs-Export erfasst IndexedDB, Datei-Backup deckt alle Kampagnen ab, Audio-Löschen rückgängig machbar, Persistenz-Randfälle getestet (completed 2026-09-05)
- [x] Phase 13: Härtung & Wartbarkeit (12/12 Pläne) — `call`-Whitelist (130 Ziele), Save-Pfad ohne Blob-Allokation, Würfelstatistik gedeckelt, vier übergroße Module in 14 Dateien aufgeteilt (alle ≤ 800 Zeilen), execCommand-Treffer auf 0, Konsole in Produktionspfaden still (completed 2026-09-06)
- [x] Phase 14: Tests & Gates (9/9 Pläne) — Toast-Race geschlossen, fünf Welt-Features abgedeckt, Lint-/Typecheck-/Coverage-Gates geschärft (completed 2026-09-07)

Tests: Jest 628 → **1120** · Playwright 319 → **323** (321 passed / 2 skipped) · pytest 24 → 24.
Sicherheit: `threats_open: 0` über alle drei Phasen (171 Bedrohungen). Nyquist: 12 COMPLIANT ·
13 COMPLIANT · 14 PARTIAL (9 datierte Restposten).

**Restschuld, bewusst geführt** (Details: [Audit](milestones/v1.2-MILESTONE-AUDIT.md), Übertrag in
[PROJECT.md](PROJECT.md) § „Übertrag aus v1.2"):

- **NQ-03..NQ-11** — die drei Gate-Ratschen sind Prosa-Regeln statt struktureller Gates; `14-GATE-BASELINE.md` in fünf Zahlen veraltet; beide stehenden Gates hängen an einem ungeprüften Extraktor
- **`npm run check` ist rot** — **224** versionierte Prettier-Dateien (Stand 2026-09-07, nach der Zwischenarbeit; die im Audit genannten 132 lagen davor), und CI fährt `format:check` gar nicht
- **7 von 8 Phase-13-Aufteilungsdateien** stehen auf `MODULE_TEST_EXCEPTIONS` — die Aufteilung geschah für Testbarkeit, eingelöst ist sie erst mit echten Tests
- **`DEBT-01` teiloffen** — `tsconfig.strict.json` deckt 8 von 134 Dateien
- **2 subjektive Bedienabnahmen offen** — Editor-Bediengefühl, DM-Screen-Masonry

**Zwei Funde des Milestone-Audits, die keine Phase gemeldet hatte:** ein korrekt kalibriertes, aber
**nie ausgeführtes** Coverage-Gate (CI fuhr blankes `npm test`), und ein totes Aktionsziel
(`populateImportNodesList`), das entgegen der Behauptung seines Plan-Summaries in beide Bundles
ging. Beide am 2026-09-07 geschlossen. Phase 13 bekam ihre nie gelaufene Sicherheits- und
Validierungsprüfung retroaktiv — 67 Bedrohungen, 16/16 Verifikationszeilen, null Lücken.

Details: [milestones/v1.2-ROADMAP.md](milestones/v1.2-ROADMAP.md) ·
Requirements: [milestones/v1.2-REQUIREMENTS.md](milestones/v1.2-REQUIREMENTS.md) ·
Audit: [milestones/v1.2-MILESTONE-AUDIT.md](milestones/v1.2-MILESTONE-AUDIT.md)

</details>

### 🚧 v1.3 Design-System (In Progress)

**Milestone-Ziel:** Die neun Befunde des Design-Audits v2 umsetzen — auf der **korrigierten
Befundlage** (`HANDOFF-V2-VERIFIKATION.md`), nicht auf dem Wortlaut des Handoffs. Farbe kommt in
allen vier Themes an, Schatten/Typografie/Tempo werden Skalen statt Sammlungen, und die
Tastaturbedienung bekommt einen sichtbaren Zustand. **Nicht verhaltensneutral:** Phase 16 (Farbe)
und Phase 18 (Typografie) ändern sichtbar, was der Nutzer sieht; Phase 15 enthält drei sichtbare
Bugfixes. Der Handoff wurde vor der Ausführung durch 14 Agenten gegen HEAD `1aba0ac` verifiziert
statt übernommen — 7 von 9 Rezepten waren defekt, N-08 ist widerlegt, 13 Blocker mussten vorab
entschieden werden. Details: `REQUIREMENTS.md`, `HANDOFF-V2-VERIFIKATION.md`.

- [ ] **Phase 15: Befundlage & Vorlauf** — 13 Blocker entschieden, 36 Kennzahlen korrigiert, die von `tools/css-usage-report.js` gemessene Menge toter CSS-Klassen gelöscht (Handoff-Angabe: 438 Klassen / ~3.174 Zeilen — nicht reproduziert, siehe DEAD-01), drei echte Defekte behoben
- [ ] **Phase 16: Farbe** — Vollständiger `--on-<rolle>`- und `--*-text`-Satz, 390 `rgba()`-Literale abgebaut, `color-scheme` pro Theme, 4,5:1 in allen vier Themes
- [ ] **Phase 17: Schatten & Bewegung** — Vier Höhenstufen mit theme-eigener, gestaffelter Deckkraft; `transition: all` (163 Stellen) abgebaut ohne die elf tragenden Fälle zu verlieren
- [ ] **Phase 18: Typografie** — Sieben-Stufen-Skala gegen eine bei 16px bleibende Wurzel, 784 `em`-Fundstellen atomar in einem Commit umgestellt
- [ ] **Phase 19: Bedienbarkeit** — Ein dokumentierter Fokusring statt einer verdeckten Dublette, Zauber-Zähler-Semantik repariert

## Phase Details

### Phase 15: Befundlage & Vorlauf

**Goal**: Vor der ersten Code-Zeile stehen korrigierte Zahlen, entschiedene Blocker und eine
bereinigte, fehlerfreie CSS-Basis — jede spätere Welle startet mit richtigen Ausgangs- und
Zielwerten statt mit totem Ballast und unpassierbaren Ratschen.
**Depends on**: Nothing (erste Phase des Milestones, folgt auf Phase 14)
**Requirements**: BASE-01, BASE-02, BASE-03, BASE-04, DEAD-01, DEAD-02, DEAD-03, FIX-01, FIX-02, FIX-03, GATE-03, GATE-04, GATE-05, MOTION-05
**Success Criteria** (what must be TRUE):

  1. Alle 13 Blocker (B-01..B-13) stehen als entschiedene, begründete Einträge (drei — B-01/B-02/B-07 — bereits als Key Decision in `PROJECT.md` gebucht); §8 aus `PATCHES.md` ist entfernt, N-08 als widerlegt geschlossen.
  2. `grep -rn "prefers-reduced-motion" assets/styles/` zeigt genau einen Top-Level-Block, neu angelegt in `core.css` (Ausgangslage: vier Top-Level-Blöcke, u. a. `dmscreen.css:1408-1419`, keiner in `core.css` — vier Entfernungen und eine Neuanlage, kein Umzug), dokumentiert und gegen Rückbau gesichert — keine Dublette, `DUBLETTEN_MAX` bleibt 0.
  3. Der Löschlauf (mit Präfixerkennung für dynamisch zusammengesetzte Klassennamen wie `condition-${…}`) senkt `assets/styles/` um **die von `tools/css-usage-report.js` gemessene Menge** toter Klassen und Regelblöcke, u. a. `dashboard.css:547-1224` (Handoff-Angabe: rund 3.174 Zeilen / 438 tote Klassen / 607 Regelblöcke — in drei unabhängigen Nachmessungen NICHT reproduziert, nur die Gesamtzeilenzahl 27.141 hat sich bestätigt; der tatsächliche Wert steht nach dem Lauf in `15-RATCHET-BASELINE.md`, siehe REQUIREMENTS DEAD-01/D-20); danach bleiben Jest 1217/1217, Playwright 354 (2 skipped) und `design-consistency.test.js` 64/64 grün, `pytest tests/build` 24/24 grün, `python build.py` und `python build.py --production` laufen durch.
  4. Im gebauten Bündel: `.dms-terrain-item` trägt padding/background/border-radius ≠ 0 und `.dms-skill-header.str` trägt background ≠ transparent (DM-Screen-Referenzwidgets „Gelände"/„Fertigkeiten" gestylt — *Korrektur D-12: hier stand zuvor „Wissensgebiete", obwohl `.dms-skill-header.str` zum Fertigkeiten-Widget gehört*); der Zauberplatz-Pip im kompakten Zauberplatz-Container der Charakterkarte (`.spell-slots-compact .slot-pip`, der von Plan 15-05 tatsächlich implementierte Selektor — *Korrektur D-55: ersetzt die in D-15 vermutete Klasse `.char-card-slots .slot-pip`, die im damals ungeprüften Markup stand, aber nirgends in `assets/styles/` gestylt war; `.spell-slots-compact`/`.slot-pip` sind die bereits vorhandenen, gestylten Pip-Regeln aus `dashboard.css` (Vorbild: `systems/spellslots/spellslots-ui.js`) — der geprüfte Sachverhalt selbst bleibt unverändert*) hat eine definierte, klickbare Breite > 0, UND ein Klick auf den Pip ändert nachweislich den persistierten Zauberplatz-Zustand des Charakters; nach einem Würfelwurf in der Haupt-Würfelansicht behält `#dice-hero-result` `font-size: 5em`/`color: var(--gold)`, und Crit-/Fumble-Färbung ist sichtbar.
  5. Jede neue Ratsche dieser und aller Folgephasen ist vorab beidseitig rot-grün bewiesen und trägt ihren gemessenen Ausgangswert im Kommentar (GATE-03); der Geltungsbereich CSS vs. JS/Templates ist pro Befund vorab entschieden und dokumentiert (GATE-04, u. a. die ~170 Fundstellen außerhalb `assets/styles/`); die Abnahme läuft **dreistufig** (GATE-05, gebucht in `PROJECT.md` § GATE-05): Stufe 1 automatisch nach jeder Welle (alle Suiten grün, Build läuft durch, GATE-01-Harness über vier Themes), Stufe 2 eine Screenshot-Serie über die Stellenliste der Welle mal vier Themes, Stufe 3 menschlich — **eine volle Vier-Themes-Runde nach JEDER der fünf Phasen 15, 16, 17, 18 und 19**, ohne Verkürzung auf eine gezielte Stellenliste. *Korrektur D-53: die zuvor hier beschriebene Absenkung auf drei volle Runden plus gezielte Stellenlisten nach 15 und 19 wurde dem Nutzer als Checkpoint-Entscheidung vorgelegt und am 2026-09-09 ausdrücklich ABGELEHNT; die ursprüngliche, striktere Form gilt. Dieser Text stand vor der Checkpoint-Antwort hier und war danach überholt.*

**Plans**: 13/14 plans executed in 12 waves

Plans:
**Wave 1**

- [x] 15-01-PLAN.md — Tracer: Ratschen-Schleife end-to-end an der Bewegungsunterdrückung (BASE-03, MOTION-05) plus `declarationsOf()`-Ausschluss

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 15-02-PLAN.md — Die 13 Blocker in PROJECT.md buchen, GATE-04 setzen, Abnahmeform GATE-05 festschreiben
- [x] 15-03-PLAN.md — Korrigierte Kennzahlen in den Handoff, Anker als Tripel, ROADMAP/REQUIREMENTS nachführen, Canonical refs
- [x] 15-04-PLAN.md — FIX-01: die drei DM-Screen-Referenzwidgets gestylt, neuer Abnahme-Spec, `DMS_UNSTYLED_MAX`

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 15-05-PLAN.md — FIX-02 Zauberplatz-Pips und FIX-03 Würfelfarbe, je mit rotem Vorlauf

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 15-06-PLAN.md — `tools/css-usage-report.js`, Stil-Diff-Harness, erste Löschliste mit Handprüfung

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 15-07-PLAN.md — Löschlauf: eine Datei je Commit, PWA-Paar in einem Commit, `INLINE_MAX` gesenkt

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 15-08-PLAN.md — `15-RATCHET-BASELINE.md`, Neuerhebung aller Kennzahlen, Abschlusslauf und Sichtung

**Wave 7** *(Gap-Closure aus `15-VERIFICATION.md`, blocked on Wave 6 completion)*

- [x] 15-09-PLAN.md — Gap 1: Blindstelle der Lebend-Erkennung schließen (CR-01/WR-01), `.npc-grid`/`.list-view-container` wiederherstellen, Prüfmodus neu messen, Fund in `WINDOWS.md`

**Wave 8** *(blocked on Wave 7 completion)*

- [x] 15-10-PLAN.md — Gap 2: CLAUDE.md widerspruchsfrei über die CSS-Dateizahl, vollständige Strukturliste, sprachunabhängiger Wächtertest

**Wave 9** *(zweite Gap-Closure aus `15-VERIFICATION.md` — Nachprüfung `gaps_found` 10/13, blocked on Wave 8 completion)*

- [x] 15-11-PLAN.md — Die drei verbliebenen Erkennungslücken schließen (CR-02 Zeilenumbruch, CR-03 Interpolationsinhalt und Zwischenvariable), sechs rot-grün bewiesene Fälle, Messblock 10

**Wave 10** *(blocked on Wave 9 completion)*

- [x] 15-12-PLAN.md — Gegenprobe des gesamten Löschstands automatisieren, sechs Klassenfamilien wörtlich aus der Historie zurückholen, `WINDOWS.md` bereinigen, Messblock 11

**Wave 11** *(blocked on Wave 10 completion)*

- [x] 15-13-PLAN.md — Stil-Vergleichslauf lasttragend machen (versionierter Sollstand, Schreibsperre, beidseitiger Schlüsselvergleich, befüllter Seed) plus Regressionsspec über berechnete Endwerte, Messblock 12

**Wave 12** *(blocked on Wave 11 completion)*

- [ ] 15-14-PLAN.md — Vorlagenzahl in CLAUDE.md und `assets/body.html` nachziehen, DOC-Wächter darauf ausdehnen, Messblock 13, GATE-05 Stufe 3 anfordern

**UI hint**: yes

**Auslegungshinweis:** GATE-03/04/05 stehen hier, nicht in den Wellen, die sie prüfen — sie legen
die Regeln fest (rot-grün-Beweispflicht, Geltungsbereich CSS vs. JS, Grün-Pflicht nach jeder Welle),
die Phasen 16–19 nur noch befolgen. **Behaviour:** teilweise verhaltensneutral. `BASE-*`
(Dokumentation) und `DEAD-*` (Löschung, durch grüne E2E-Suite abgesichert) sind verhaltensneutral;
`FIX-01..03` sind sichtbare Bugfixes (DM-Screen-Widgets, Zauberplatz-Anzeige, Würfelfarbe) — UAT
sollte gezielt gegenprüfen, dass sie jetzt wie erwartet aussehen.

### Phase 16: Farbe

**Goal**: Die Palette erreicht in allen vier Themes den WCAG-Kontrast — auf gefüllten Flächen, als
Textfarbe und in den nativen Bedienelementen.
**Depends on**: Phase 15 (korrigierte Ausgangswerte, gelöschter toter Bestand, GATE-03/04/05-Disziplin stehen)
**Requirements**: COLOR-01, COLOR-02, COLOR-03, COLOR-04, COLOR-05, COLOR-06, COLOR-07, COLOR-08, COLOR-09, COLOR-10, COLOR-11, GATE-01, GATE-02
**Canonical refs**: .planning/PROJECT.md (§ Blocker-Entscheidungen v1.3), .planning/HANDOFF-V2-VERIFIKATION.md, .planning/REQUIREMENTS.md
**Success Criteria** (what must be TRUE):

  1. Headless gegen das gebaute Bündel gemessen (GATE-01-Harness): `.btn-primary`, `.btn-success`, `.btn-gold` sowie ihre `:hover`-Ableitungen erreichen 4,5:1 in allen vier Themes (Ausgangswerte: Gold/Light 2,98, Grün/Light 3,02, Grün/Sepia 2,55; `.btn-gold:hover` Light 4,67, `.btn-success:hover` in drei von vier Themes durchgefallen).
  2. Ein Property-Mengen-Test (GATE-02) zeigt für alle vier Theme-Blöcke `FEHLT []` / `EXTRA []` bei vollständigem `--on-<rolle>`-Satz für alle acht Akzente plus `--gold-dim`/`--gold-hover`/`--green-dim`.
  3. `--on-accent` (bzw. sein Ersatz) besteht headless-gemessen in allen vier Themes gegen jede Trägerfläche — namentlich `.fr-ruf-btn-plus` (`welt.css:1073`, Ausgangswert 1,74:1 im Standard-Theme, der schwerste Kontrastfehler im Baum).
  4. `--*-text`-Rollen (inkl. `--red-text` im Aliasblock) erreichen 4,5:1 gegen `--bg-card` in allen vier Themes; `--coin-*`/`--attr-*` erreichen 4,5:1 gegen `--bg-dark` in allen vier Themes (Ausgangswert bis 1,29:1 in Light).
  5. `color-scheme` ist pro Theme gesetzt (Ausgangswert 0 Treffer) — Checkbox/Select/Zahlenfeld folgen im Dark-/Contrast-Theme sichtbar dem Theme (Sichtprüfung in allen vier Themes); `grep -rn "rgba([[:space:]]*[0-9]" assets/styles/` zeigt nur die vorab benannten, kommentierten Ausnahmen (Ausgangswert 390 Fundstellen in 143 [Bericht: 173] Werten nach Leerraum-Normierung — D-30).

**Plans**: TBD
**UI hint**: yes

**Auslegungshinweis:** GATE-01 (headless gemessene Abnahme) und GATE-02 (Property-Mengen-Test der
vier Theme-Blöcke) sind hier verortet, weil `COLOR-*` die erste Welle ist, die einen berechneten
Endwert statt Deklarationstext braucht — `TYPO-*` (Phase 18) nutzt denselben Harness weiter, baut
ihn nicht neu. **Innerhalb dieser Phase** müssen `COLOR-01..07` (Tinten/Textrollen) VOR
`COLOR-08..11` (Farbliterale) abgeschlossen sein: §3b verschiebt den Untergrund von rund 95
„Tint + gleichfarbige Schrift"-Regeln — die Zuordnungsregel für die Schriftfarbe muss vorher stehen.
**Behaviour:** NICHT verhaltensneutral — Schriftfarben auf Knöpfen und Flächen ändern sich sichtbar
in allen vier Themes. Braucht Sichtprüfung in allen vier Themes, nicht nur Testabnahme.

### Phase 17: Schatten & Bewegung

**Goal**: Schatten kommen aus vier theme-eigenen Höhenstufen statt aus 65 verstreuten Werten, und
Übergänge sind gezielt statt pauschal — ohne die elf Fälle zu verlieren, die heute unter `all` die
sichtbare Arbeit leisten.
**Depends on**: Phase 16 (Trägerflächen-Urteile werden geteilt; 1px-Haarlinien stehen teils in derselben Deklaration wie ein Schatten)
**Requirements**: ELEV-01, ELEV-02, ELEV-03, ELEV-04, MOTION-01, MOTION-02, MOTION-03, MOTION-04
**Canonical refs**: .planning/PROJECT.md (§ Blocker-Entscheidungen v1.3), .planning/HANDOFF-V2-VERIFIKATION.md, .planning/REQUIREMENTS.md
**Success Criteria** (what must be TRUE):

  1. `box-shadow` kommt aus vier Höhenstufen-Tokens (Ausgangswert: 88 Deklarationen, 65 verschiedene Werte, 58 mit hartem `rgba(0,0,0,…)`, `var(--shadow)` genau 1× benutzt) oder aus den rund 40 [Bericht: 22] benannten Sonderfällen (9 farbige Glühe, 4 goldene Zustands-Schlagschatten, 4 Tabellenzeilen-Größen, 1 negativer X-Offset, 2 `@keyframes`-Zustände, plus die weiteren Fälle aus der vollständigen 88er-Klassifikation — D-37).
  2. Die Deckkraft ist pro Höhenstufe gestaffelt (nicht aus einem einzigen `--shadow` abgeleitet), und das Contrast-Theme hat einen eigenen, nicht-weißen Schattenwert — oder die Inversion ist als eigene Key Decision ausdrücklich freigegeben (Ausgangslage: `variables.css:101` setzt dort `--shadow: rgba(255,255,255,0.1)`).
  3. `grep -c "transition: all" assets/styles/*.css` (summiert) = 0 (Ausgangswert 163); Sichtprüfung bestätigt: Floating-Dice-Panel schließt weiterhin weich (kein Sofort-Verschwinden), die acht Würfelknöpfe und `encounters.css:1537` behalten ihre `filter: brightness()`-Hoveraufhellung.
  4. Es gibt drei Dauer-Tokens und eine Kurve (Ausgangswert 8 Dauern, u. a. `0.08s` in `party.css`); ob `--ease` die 263 heute impliziten `ease`-Übergänge ersetzt, ist eine eigene, dokumentierte Key Decision (MOTION-04) — nicht stillschweigend angenommen.
  5. Nach der Welle sind Jest, Playwright und pytest grün, `DUBLETTEN_MAX` bleibt 0 und `IMPORTANT_MAX` bleibt bei/unter 105; der `prefers-reduced-motion`-Block aus Phase 15 bleibt der einzige seiner Art.

**Plans**: TBD
**UI hint**: yes

**Behaviour:** größtenteils verhaltensneutral — Schatten und Timing sollen optisch gleich wirken
(gestaffelte statt einheitliche Deckkraft ist eine Reparatur, kein Redesign). Ausnahme: `MOTION-04`
(`--ease` app-weit) ist eine bewusste, separat freizugebende Änderung des Bewegungsgefühls und
braucht eine eigene Sichtprüfung, falls angenommen.

### Phase 18: Typografie

**Goal**: `font-size` kommt aus einer Sieben-Stufen-Skala gegen eine bei 16px bleibende Wurzel statt
aus 30 `em`-Werten, und `font-weight` kennt keine folgenlosen Zwischenformen mehr.
**Depends on**: Phase 17 (Farbe und Bewegung müssen stehen, damit eine optische Regression nach der Typografie-Umstellung eindeutig zuzuordnen ist)
**Requirements**: TYPO-01, TYPO-02, TYPO-03, TYPO-04, TYPO-05
**Canonical refs**: .planning/PROJECT.md (§ Blocker-Entscheidungen v1.3), .planning/HANDOFF-V2-VERIFIKATION.md, .planning/REQUIREMENTS.md
**Success Criteria** (what must be TRUE):

  1. Derselbe grep-Ausdruck wie in der CHECKLISTE findet 0 `em`-Fundstellen für `font-size` in `assets/styles/` (Ausgangswert 784 in 30 Werten); Wurzelregel und alle Ersetzungen sind in einem einzigen Commit gelandet (TYPO-01, atomar — kein dateiweiser Rollout möglich, sonst ist die App in jeder noch nicht umgestellten Datei 12,5 % zu klein).
  2. Die Wurzel bleibt bei 16px (kein `html{font-size:…}`, `body{}` setzt weiterhin keine `font-size`); die `--text-*`-Skala ist gegen 16 gerechnet (`xs 0.6875rem`, `sm 0.75rem`, `md 0.875rem`, `lg 1rem`, …) — headless gemessen bleibt die berechnete Basisschriftgröße in beiden Layout-Profilen bei 16px.
  3. Kein Element unter `--text-xs` in der UI — headless gemessen sinkt die Zahl der Elemente unter 11px gegenüber dem Ausgangswert 169 von 5.032 (kleinster gemessener Wert 7,70px, `.dms-live-badge`), statt wie bei der ungeprüften Handoff-Variante auf 326 zu steigen.
  4. Die vier sichtbarsten Stellen sind nach der Umstellung gesichtet: Karten-Metazeilen (Orte/NPCs), Statblock-Tabellen im Bestiar, DM-Screen-Widgets, Initiative-Zeile — in allen vier Themes.
  5. `grep -rn "font-weight: *\(bold\|normal\|300\)" assets/styles/` liefert 0 Treffer außerhalb der einzeln entschiedenen `300`-Stelle (Ausgangswert 21 garantiert folgenlose Stellen); die tote Doppelzeile `spells.css:338-339` ist entfernt, `IMPORTANT_MAX` sinkt von 105 auf 104.

**Plans**: TBD
**UI hint**: yes

**Behaviour:** NICHT verhaltensneutral — `TYPO-01` vereinheitlicht Größen, die heute je Einbautiefe
verschieden sind; nach der Umstellung sind sie überall gleich. Braucht Sichtprüfung an den vier
benannten Stellen in allen vier Themes, keine reine Testabnahme.

### Phase 19: Bedienbarkeit

**Goal**: Es gibt einen dokumentierten Fokusring statt einer verdeckten Dublette, und die
Zauber-Zähler zeigen wieder korrekt an, was sie behaupten.
**Depends on**: Phase 18 (kleinste, vom Rest unabhängige Welle — zuletzt)
**Requirements**: UX-01, UX-02, UX-03, UX-04, UX-05, UX-06
**Canonical refs**: .planning/PROJECT.md (§ Blocker-Entscheidungen v1.3), .planning/HANDOFF-V2-VERIFIKATION.md, .planning/REQUIREMENTS.md
**Success Criteria** (what must be TRUE):

  1. Es gibt genau eine dokumentierte globale `:focus-visible`-Regel, verschoben nach `core.css` (Ausgangslage: bereits vorhanden in `dmscreen.css:1722`, nackt auf Klammertiefe 0) — keine zweite Regel danebenstehend.
  2. Die Ringersatz-Frage (goldener Rahmen als Ersatz ja/nein) ist als Key Decision entschieden und umgesetzt: bei „ja" sind die 33 `.x:focus{outline:none}`-Stellen fertig; bei „nein" sind alle 33 auf `:focus-visible` umgeschrieben.
  3. `.cf-combat-value input:focus` hat einen sichtbaren Fokuszustand (box-shadow-Ring oder `:focus-within` an `.cf-combat-stat`) — Tab-Test bestätigt einen sichtbaren Ring an allen Elementen, die strukturell Fokus annehmen können.
  4. `#spells-count` zeigt nach Anlegen/Löschen eines Zaubers sofort die korrekte Gesamtzahl (kein Stale-Stand bis zum nächsten `renderAll`), UND `#spell-count` (📖 x/y-Filterrückmeldung) bleibt erhalten und funktional — dieselbe Reparatur greift bei `#quests-count`.
  5. `.filter-bar` behält sein Flex-Layout (`display:flex; gap:6px; flex-wrap:wrap`) nach jeder Umbenennung — die drei Zauber-Filterleisten sehen vor und nach der Änderung gleich aus (Sichtprüfung).

**Plans**: TBD
**UI hint**: yes

**Behaviour:** teilweise verhaltensneutral. `UX-01/02/03` verschieben/konsolidieren größtenteils
bereits vorhandenes Verhalten (der Fokusring existiert schon global) — sichtbar nur an den Stellen,
die heute wirklich ringlos sind. `UX-04/05` sind sichtbare Bugfixes (Zähler zeigt jetzt korrekt an).
`UX-06` MUSS layoutneutral bleiben (Bedingung, kein Vorher/Nachher-Unterschied).

**Nicht in dieser Phase (bewusst abgewählt):** Tastatur-Erreichbarkeit als eigener JS-Strang
(A11Y-01..06) — `UX-01` bleibt an den 176 betroffenen Elementen wirkungslos, und die Tastaturprobe
der CHECKLISTE ist deshalb nicht abnehmbar und aus den Akzeptanzkriterien heraus. Siehe
`REQUIREMENTS.md` § „Future Requirements".

## Progress

**14 Phasen abgeschlossen · 109 Pläne · 3 Milestones geshippt.**

### 🚧 v1.3 Design-System

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 15. Befundlage & Vorlauf | 13/14 | In Progress|  |
| 16. Farbe | –/TBD | Not started | - |
| 17. Schatten & Bewegung | –/TBD | Not started | - |
| 18. Typografie | –/TBD | Not started | - |
| 19. Bedienbarkeit | –/TBD | Not started | - |

**Execution Order:** streng sequenziell 15 → 16 → 17 → 18 → 19 (siehe Depends-on-Kette und
Empfohlene Reihenfolge in `HANDOFF-V2-VERIFIKATION.md`).

Nächster Schritt: `/gsd-plan-phase 15`
