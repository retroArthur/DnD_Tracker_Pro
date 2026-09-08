# Phase 15: Befundlage & Vorlauf - Context

**Gathered:** 2026-09-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Vor der ersten Design-Code-Zeile stehen: die zehn offenen Blocker schriftlich entschieden, die
korrigierten Kennzahlen in Handoff und Planungsdokumenten eingearbeitet, der tote CSS-Bestand
gelöscht, drei sichtbare Defekte behoben — und die Regeln festgelegt (GATE-03/04/05), denen die
Phasen 16–19 dann nur noch folgen.

**Nicht in dieser Phase:** jede Farb-, Schatten-, Typografie- oder Fokusarbeit. Die Entscheidungen
zu B-03/B-04/B-05/B-06/B-08/B-09/B-11/B-12 werden hier *getroffen und gebucht*, aber in den
Phasen 16–19 *ausgeführt*. Phase 15 ändert Code nur an drei Stellen: FIX-01, FIX-02, FIX-03 —
plus der Löschlauf, der nichts hinzufügt.

**Methodengrundlage.** Dieses Projekt hat als Key Decision gebucht, den Design-Handoff zu
verifizieren statt zu übernehmen; dabei erwiesen sich 7 von 9 Rezepten als defekt. Dieselbe
Haltung gilt für die Entscheidungen unten: jede tragende Zahl wurde gegen HEAD `4faca38`
nachgemessen, jede Entscheidung adversarisch gegengeprüft, und die sechs strittig gebliebenen
Kennzahlen wurden mit einer je benannten Zählart neu erhoben. Wo eine Messung ein Planungsdokument
widerlegt, gilt die Messung — die Korrektur des Dokuments ist Arbeit dieser Phase.

</domain>

<decisions>
## Implementation Decisions

Format nach BASE-01d: eine Zeile je Entscheidung, `D-NN` als Kennung, die Blocker-/Requirement-ID
in Klammern am Ende. Die Blocker-ID ist nie selbst die Bullet-Kennung.

### Befundlage, Protokoll und Dokumentkorrektur

- **D-01: Kanonischer Ort der Blocker-Entscheidungen ist PROJECT.md** — Ein neuer Abschnitt `## Blocker-Entscheidungen v1.3 (B-01..B-13)` zwischen `## Key Decisions` (Z.462) und `## Evolution` (Z.485); alle dreizehn Blocker bekommen zusätzlich eine Verweiszeile in der bestehenden Key-Decisions-Tabelle, auch die drei bereits gebuchten. Warum: gemessen ist PROJECT.md die einzige Datei, die für jede Phase 16–19 garantiert und vollständig gelesen wird (`discuss-phase.md:238` führt `cat .planning/PROJECT.md` ohne Ausschnitt aus; `gsd-planner.md:347` schreibt `@.planning/PROJECT.md` in den `<context>`-Block jeder PLAN.md, womit auch jeder Executor sie lädt). Folge: PROJECT.md wächst um rund 90 Zeilen. (BASE-01)
- **D-02: Pflicht-Spiegel über Canonical refs und diesen CONTEXT** — Jede Phase 16–19 bekommt in ihrem ROADMAP-Detailblock direkt unter `**Requirements**` die Zeile `**Canonical refs**: .planning/PROJECT.md (§ Blocker-Entscheidungen v1.3), .planning/HANDOFF-V2-VERIFIKATION.md, .planning/REQUIREMENTS.md`. Warum: gemessen liest weder `gsd-planner` noch `gsd-phase-researcher` PROJECT.md in seinem eigenen `<project_context>` — beide nennen dort nur `./CLAUDE.md` und Projekt-Skills; der einzige Weg, der beide zwangsläufig erreicht, ist der `<canonical_refs>`-Block der CONTEXT.md, und der wird laut `discuss-phase.md:308` aus genau dieser ROADMAP-Zeile gefüllt. Heute hat die ROADMAP null solche Zeilen. (BASE-01)
- **D-03: `.planning/DECISIONS-INDEX.md` wird nicht angelegt** — Warum: ihre einzige Fundstelle im GSD-Kern ist `discuss-phase.md:243`, und ihre Semantik ist ein *Ersatz*, kein Zusatz („read that instead … supersedes per-phase reads"). Anlegen würde für die Phasen 16–19 die Lektüre der vorigen CONTEXT.md abschalten — eine gezielte Lücke gegen eine breite getauscht. Folge: Phase 19 sieht diesen CONTEXT nicht mehr; das decken D-01 und D-02 ab. (BASE-01)
- **D-04: Der Handoff wird in-place korrigiert, `.dc.html` und `support.js` bleiben unberührt** — `BEFUNDE-v2.md`, `PATCHES.md`, `CHECKLISTE.md` und `README.md` werden an den korrigierten Stellen umgeschrieben. Warum: die CHECKLISTE ist zugleich die Abnahmevorschrift — eine Korrekturschicht daneben hieße, dass die Abnahme aus dem falschen Dokument gefahren wird. Folge: das Lieferantendokument weicht danach vom Auslieferungsstand ab; die Prüfspur sichert D-05. (BASE-02)
- **D-05: Verworfenes wird markiert, nicht gelöscht** — `PATCHES.md` §8 bekommt einen Block `**VERWORFEN (B-07, 2026-09-08)**` mit Begründung statt entfernt zu werden; N-08 wird in `BEFUNDE-v2.md` als widerlegt geschlossen, mit Verweis auf `HANDOFF-V2-VERIFIKATION.md` B-07. Warum: stilles Umschreiben eines externen Lieferdokuments zerstört genau die Prüfspur, der dieses Projekt seinen wichtigsten Fund verdankt. Folge: ROADMAP-Erfolgskriterium 1 („§8 ist entfernt") ist als „entfernt aus dem Ausführungsumfang" zu lesen und wird entsprechend präzisiert. (BASE-03)
- **D-06: Der Abnahme-grep schlägt die Prosa-Zahl** — Verbindlich ist 163, nicht 151. Warum: der grep der CHECKLISTE findet alle 163; die Abnahme ist heute strenger als ihre eigene Anweisung, und die strengere Fassung ist die richtige. (BASE-02)
- **D-07: Jeder PATCHES-Anker wird zum Tripel** — Datei:Zeile + wörtlicher Mehrzeilentext + grep mit erwarteter Trefferzahl. Warum: mehrere Anker zeigen ins Leere (`.btn-primary` ist ein mehrzeiliger Block in `core.css`, nicht der zitierte Einzeiler; die in §3b als `core.css` zitierte Zeile steht zweimal in `loot.css`). Ein Anker, der nur aus einer Zeilennummer besteht, überlebt den Löschlauf nicht. (BASE-02)
- **D-08: Die redaktionelle Nachführung von ROADMAP.md und REQUIREMENTS.md ist benannte Arbeit dieser Phase** — Es gibt keinen separaten „Umfangsinhaber". Konkret nachzuführen: FIX-01s falsche Datei- und Zeilenangaben (D-11), die Widget-Benennung (D-12), `.char-slot-pip` in Erfolgskriterium 4 (D-15), die `prefers-reduced-motion`-Zeilenspanne (D-18), die MOTION-05-Phasenzuordnung (D-18), die rgba-Wertezahl (D-22), ELEV-01/ELEV-04 (D-30). Warum: sonst hat die Phase Erfolgskriterien, die zur Abnahme weder erfüllt noch geändert sind. (BASE-02, BASE-04)

### Die drei sichtbaren Defekte

- **D-09: CSS folgt dem JS-Markup, das JS bleibt unangetastet** — Für alle betroffenen DM-Screen-Widgets werden die CSS-Blöcke auf die flache Struktur umgeschrieben, die das JS heute erzeugt. Warum: `tests/unit/__snapshots__/dmscreen-characterization.test.js.snap` friert das Markup aller drei Widgets in je zwei dedizierten Snapshots plus den Gesamt-Snapshots ein (Phase-13 Key Decision D-04, heute 51 Tests / 50 Snapshots grün). CSS-Selektoren zu ändern bricht sie nicht, JS-Markup zu ändern schon. Folge: die ursprünglich reichere Optik (eigene Beispiel-Tags, waagerechte Tag-Liste) entfällt. — **Reversibility:** costly — die Snapshot-Datei ist das Regressionsnetz zweier Phasen; eine spätere Markup-Umstellung erzwingt ihre Neuaufnahme und damit den Verlust des Vorher-Beweises. (FIX-01)
- **D-10: Alle drei Referenzwidgets werden repariert, nicht zwei** — Gelände (4 von 9 Klassen ohne Regel), Fertigkeiten (3 von 5), Wissensgebiete (3 von 8). Warum: gemessen ist Fertigkeiten prozentual am stärksten kaputt, und `ROADMAP`-Erfolgskriterium 4 prüft mit `.dms-skill-header.str` genau dieses Widget — wer FIX-01 wörtlich abarbeitet und nur Gelände plus Wissensgebiete repariert, lässt ausgerechnet die geprüfte Klasse ungestylt. (FIX-01)
- **D-11: Die Fundstellenangaben in FIX-01 werden korrigiert** — `dmscreen.css:2469-2510` ist der Block FERTIGKEITEN-WIDGET und enthält kein einziges `.dms-terrain-*`; die Terrain-Regeln liegen bei 2829–2874. Das zitierte JS-Fenster `dmscreen-widgets-reference.js:89-118` ist der Fertigkeiten-Renderer; der Gelände-Renderer liegt in `dmscreen-widgets-combat.js:133-171`. Warum: beide Angaben stehen so in REQUIREMENTS.md und würden einen Executor an die falsche Stelle führen. (FIX-01, BASE-02)
- **D-12: „Wissensgebiete" und „Fertigkeiten" sind zwei verschiedene Widgets** — Die Registry ist eindeutig: `knowledge` heißt „Wissensgebiete" (`dmscreen-render.js:428`), `skills` heißt „Fertigkeiten" (:380), `terrain` heißt „Gelände" (:422). REQUIREMENTS FIX-01 nennt „Wissensgebiete", belegt es aber mit einer Klasse aus „Fertigkeiten". Warum: die Verwechslung ist die Ursache dafür, dass zwei aufeinanderfolgende Analysen dasselbe falsche Widget bearbeitet haben. (FIX-01, BASE-02)
- **D-13: Die Attributfarben der Fertigkeitsköpfe kommen aus den kanonischen Attribut-Tokens** — Die fünf hartkodierten `rgba`-Hintergründe und die fünf `var(--red|green|blue|purple|pink)`-Schriftfarben in `dmscreen.css:2490-2494` entfallen; an ihre Stelle tritt je `color-mix(in srgb, var(--attr-<x>) 20%, transparent)` plus `color: var(--attr-<x>)`. Warum: die Regeln führen heute eine zweite, abweichende Attributpalette gegen die kanonische aus den Attribut- und Rettungswurf-Widgets. Folge: fünf rgba-Literale verschwinden aus Phase 16, und die `--attr-*`-Kontrastarbeit (Phase-16-Kriterium 4) wirkt danach auch hier. (FIX-01)
- **D-14: `renderCompactSpellSlots` wird an Ort und Stelle auf die `.slot-pip`-Familie umgestellt** — Funktionsname und Aufrufkette bleiben; nur der Rumpf wird ersetzt und erzeugt `.slot-pip` mit `data-id`/`data-value`. Die `char-slot-*`-Familie bekommt **keine** eigenen CSS-Regeln. Warum: gemessen ist der aktive Renderer der ungestylte *und* der funktionslose — der Handler liest ausschließlich `ctx.id`/`ctx.value` aus `data-id`/`data-value` (`ui/event-delegation.js:95-97`), `party-render.js` setzt `data-char`/`data-level`/`data-index`; ein Klick ruft heute `toggleSpellSlot(null, NaN)` und bricht still ab. `.slot-pip` ist gestylt (`dashboard.css:1320/1335/1340`, Klammertiefe 0 — nicht media-gekapselt) und attributkompatibel. Weil der Funktionsname bleibt, ändert sich `eslint.generated-globals.js` nicht. (FIX-02)
- **D-15: Erfolgskriterium 4 wird auf `.spell-slots-compact .slot-pip` umgeschrieben** — Warum: `.char-slot-pip` verschwindet durch D-14 aus dem Markup, das Kriterium wäre in seinem Wortlaut nicht mehr messbar. Der geprüfte Sachverhalt (definierte, klickbare Breite > 0) bleibt unverändert und bekommt eine zweite Bedingung: der Klick ändert den persistierten Zustand. (FIX-02, BASE-02)
- **D-16: FIX-03 wird rein JS-seitig repariert, kein neues CSS** — `dice-core.js:345` `heroResult.className = ''` wird zu `heroResult.className = 'dice-hero-result'`; die `crit`/`fail`-Klassen wandern vom Container `#dice-hero` auf `#dice-hero-result`, wo die Regeln stehen (`dice.css:29/34`). `createConfetti(heroContainer)` bleibt auf dem Container. Warum: `.dice-hero.crit`/`.fail` existiert in keiner CSS-Datei; das Floating-Panel macht es mit `.fdp-number.crit` bereits richtig — die Reparatur gleicht die Hauptansicht an das funktionierende Vorbild an, statt eine zweite Regelfamilie anzulegen. (FIX-03)
- **D-17: Die drei Fixes werden am gebauten Bündel abgenommen, mit genau einer neuen Ratsche** — Ein neuer Playwright-Spec misst berechnete Endwerte (`getComputedStyle`) für alle drei Fixes; dazu genau eine neue Ratsche `DMS_UNSTYLED_MAX` in `design-consistency.test.js`, die die im `class`-Attribut erzeugten, aber regelfreien `dms-*`-Klassen zählt. Warum: das bestehende 64-Test-Netz prüft ausschließlich Deklarationstext — genau deshalb konnten drei Widgets ungestylt rendern, ohne dass etwas rot wurde. Der Zählart-Filter auf `class`-Attribute ist zwingend: ohne ihn zählt dieselbe Suche 32 statt 15, weil 16 `data-action`-Werte und Element-IDs mitgezählt würden. (FIX-01, GATE-03)

### Löschlauf

- **D-18: `prefers-reduced-motion` — vier Blöcke fallen, einer wird in `core.css` neu angelegt** — Gemessen liegen vier Top-Level-Blöcke vor (`command-palette.css:153-159`, `dmscreen.css:1408-1419`, `migration.css:231-239`, `pwa.css:130-134`) und `core.css` hat **null**. Es sind also vier Entfernungen und eine Neuanlage, kein Umzug. Die `.skeleton`-Übersteuerung fährt nicht mit: `.skeleton` hat null Verwender — 12 von 12 Treffern im Quellbaum liegen in `dmscreen.css` selbst; Basisregel und `@keyframes` fallen als toter Bestand. Die drei Komponentenblöcke sind wirkungsseitig redundant, der `pwa`-Block ist überdies schon heute inert (Spezifität 0-1-0 gegen `.pwa-update-banner[style*="flex"]` 0-2-0). Danach zeigt `grep -rn "prefers-reduced-motion" assets/styles/` genau einen Treffer, in `core.css` — Erfolgskriterium 2 hält in seinem Wortlaut. Die Zeilenangabe 1408-1414 in REQUIREMENTS/ROADMAP ist an beiden Enden falsch und wird auf 1408-1419 korrigiert; die MOTION-05-Zuordnung zu Phase 17 wird auf Phase 15 korrigiert. — **Reversibility:** costly — der Block ist die einzige globale Bewegungsunterdrückung der App; ein Fehler hier ist am Bildschirm unsichtbar und nur unter emuliertem `prefers-reduced-motion` messbar. (BASE-03, DEAD-01, MOTION-05)
- **D-19: Eine Rückbau-Ratsche sichert den Block** — Ein Test in `design-consistency.test.js` prüft: genau ein Vorkommen von `prefers-reduced-motion` in `assets/styles/`, und es steht in `core.css`. Warum: BASE-03 verlangt „gegen Rückbau gesichert", und die im Handoff vorgeschlagene Ratsche T-4 taugt nicht — ihre Regex matcht 211.080 Zeichen quer über zwei Dateien und ist heute schon grün. Beidseitiger Beweis nach D-33. (BASE-03)
- **D-20: Ein eingechecktes Werkzeug erzeugt die bindenden Löschzahlen** — `tools/css-usage-report.js` (Node, ohne Abhängigkeiten) gibt je CSS-Datei tote Klassen, tote Regelblöcke, Zeilen darin und die vier DEAD-03-Basisgrößen aus, alle nach Kommentarentfernung. Warum: die Handoff-Zahlen (438 Klassen, 607 Blöcke, ~3.174 Zeilen) sind methodenabhängig und in drei unabhängigen Nachmessungen nicht reproduziert worden; nur `27.141` Gesamtzeilen hat sich bestätigt. Gelöscht wird die vom Werkzeug gemessene Menge, nicht die zitierte. Folge: die Zahlen in ROADMAP SC-3 und REQUIREMENTS DEAD-01 werden durch „die vom Werkzeug gemessene Menge" plus den tatsächlichen Wert ersetzt. (DEAD-01, DEAD-02)
- **D-21: Dreistufige Lebend-Erkennung, Präfixliste eingefroren** — Stufe 1 Wort-Token (Teilstring-Treffer zählen **nicht**); Stufe 2 die genau fünf Präfixe `color-`, `condition-`, `editor-toolbar-`, `rel-btn-`, `tag-`, ausschließlich aus Klassen-Kontexten gewonnen (`class="…"`, `className =`, `classList.*`); Stufe 3 Anker-Regel für Verbundselektoren. Warum: Teilstring-greps sind als Prüfmethode unbrauchbar — eine Stichprobe von 27 toten Klassen meldete zwei Fehlalarme, die sich als Teiltreffer auflösten. Die Handoff-Angabe „140 präfixgerettete Klassen" ist nicht reproduzierbar; klassenkontext-beschränkt retten die fünf Präfixe 34. — **Reversibility:** costly — die Regel bestimmt, was gelöscht wird; ein zu weiter Filter lässt toten Bestand stehen, ein zu enger löscht lebendes CSS. (DEAD-02)
- **D-22: Fehlalarm-Prüfung ist Pflicht, `.pwa-install-banner` fällt gemeinsam mit seinem Markup** — Die Klasse steht im Markup (`assets/templates/modals-editors.html`), ist also keine reine CSS-Löschung: CSS, Bannermarkup und die dadurch verwaisenden `CALL_ACTION_WHITELIST`-Einträge fallen in *einem* Commit, mit eigenem UAT-Punkt (PWA-Installation über den Kopfzeilen-Knopf auslösen). Die vier übrigen namentlich genannten Ziele sind geprüft und werden gelöscht. Warum: die PWA-Installation ist ein in v1.0-UAT verifiziertes Feature; ein halb gelöschtes Banner wäre ein sichtbarer Schaden. (DEAD-01, DEAD-02)
- **D-23: Eine Datei je Commit, MAP-Block zuerst, Testdatei zuletzt** — Rund 18 Commits: erst der MAP-Block in `dashboard.css` allein, dann je ein Commit pro CSS-Datei absteigend nach Löschmenge, dann das PWA-Paar, zuletzt die Sammeländerung an `design-consistency.test.js`. Warum: Bisektierbarkeit — bei einem einzigen Löschcommit über 5.000 Zeilen ist ein Regressionsfund nicht zuzuordnen. Der Commit-Betreff nennt Datei und gemessene Zeilenzahl. (DEAD-01)
- **D-24: Der Nachweis steht auf drei Säulen, aber der Stil-Diff darf nicht leer verlangt werden** — Erstens ein Playwright-Vergleichslauf berechneter Stile über alle Ansichten (feste Eigenschaftsliste ohne `width`/`height`, je einmal mit `[data-layout="mobile"]` und mit emuliertem `prefers-reduced-motion`), Abzug vor dem ersten Löschcommit und nach jedem weiteren; zweitens die vollständig grüne Suite; drittens menschliche UAT nach D-35. Der Diff ist **erwartungsgeführt**, nicht leer: FIX-01/02/03 ändern berechnete Stile absichtlich, und die Änderungen sind vorab benannt. Warum: ein Gate „Diff muss leer sein" widerspricht den drei Bugfixes derselben Phase und wäre nie passierbar. (DEAD-01, GATE-05)
- **D-25: Die Löschliste wird nach den FIX-Commits neu erhoben, nicht fortgeschrieben** — FIX-01 und FIX-02 laufen als eigene Commits **vor** dem Löschlauf; danach misst das Werkzeug neu. Es gibt keine vorab eingefrorene `dms-`Ausnahmeliste. Warum: FIX-01 belebt neun heute tote Selektoren wieder und FIX-02 vier weitere; eine vorab fixierte Liste wäre ab dem ersten FIX-Commit falsch. Gemessen ist 62 die korrekte Zahl toter `.dms-`Klassenselektoren — die kursierende 63 entsteht nur durch Mitzählen des `@keyframes`-Namens `dms-live-pulse`, der überdies lebt (`dmscreen.css:3084`). (DEAD-01, DEAD-03, FIX-01)
- **D-26: Ein Baseline-Artefakt, erhoben nach dem Löschlauf** — `15-RATCHET-BASELINE.md` im Phasenverzeichnis, formgleich zu `14-GATE-BASELINE.md`, erzeugt aus `tools/css-usage-report.js`; es gibt kein zweites Artefakt und keine phaseneigene Neuerhebung der Grenzwerte. Die Erhebung ist der **letzte** Plan der Phase 15, nach BASE → FIX → DEAD. Warum: die kursierenden Zahlen (394 rgba-Vorkommen, 163 `transition: all`, 88 `box-shadow`, 784 `em`) sind Vor-Löschlauf-Stände und dürfen nicht als Grenzwert eingetragen werden — sonst frieren die neuen Ratschen toten Bestand ein. (DEAD-03, GATE-03)

### Farbmechanik und Ausnahmelisten (Ausführung: Phase 16)

- **D-27: Eine Mechanik — color-mix löst die rgb-Tokenfamilie ab** — Alle theme-fähigen Farbauflagen werden `color-mix(in srgb, var(--token) N%, transparent)`; die zwölf `--*-rgb`-Deklarationen, ihr Wartungskommentar und die beiden daran hängenden F-01-Tests entfallen im selben Commit. Warum: `color-mix` ist im Projekt bereits etabliert und überwiegt (13 Nutzungen gegen 6), und das Serialisierungsrisiko ist gemessen kleiner als behauptet — es gibt **genau ein** `toHaveCSS` im gesamten E2E-Baum (`wiki.spec.js:396`), nicht sieben; die sieben rgba-Stellen in den eingefrorenen Editor-Specs sind Zeichenkettenvergleiche auf das `style`-Attribut und von der Serialisierung berechneter Farben nicht betroffen. — **Reversibility:** costly — die Umstellung berührt rund 250 Fundstellen; ein Rückweg verlangt denselben Durchlauf rückwärts plus die Wiederanlage der Tokenfamilie. (B-04)
- **D-28: `T-2` wird als Ausnahmeliste geführt, geprüft je Vorkommen** — „Kein `rgba()`/`rgb()` mit Zahlentripel in `assets/styles/` außer den in der Datei markierten und in der Testdatei gelisteten Ausnahmen." Marker ist ein nachgestellter Kommentar auf derselben physischen Zeile: `/* rgba-ok[<i>]: <Grund> */`. Es gibt **keine** regelbasierte Freistellung schwarzer Schatten und keine Datei-Ausnahme für `variables.css`. Warum: die drei kursierenden Fassungen der Ausnahmeliste schlossen einander aus; die Vorkommensprüfung ist die einzige, die trägt, weil 19 Zeilen mehr als ein `rgba` tragen und mehrzeilige `box-shadow`-Werte jede zeilenbasierte Zählung systematisch verschieben. (B-05, COLOR-08)
- **D-29: Schwarze und weiße Auflagen bekommen themelose Tokens, alle in Phase 16** — `--scrim` (Verdunkelung hinter Modalen) und `--shadow-ink` (Schattentinte); die weißen Auflagen gehen auf `--sheen` bzw. die `--overlay-*`-Familie, 13 tote `var()`-Rückfallwerte werden ersatzlos gestrichen. Warum: nur wenn Phase 16 *alle* schwarzen Auflagen mitzieht, ist Phase-16-Kriterium 5 zum Zeitpunkt seiner Abnahme erfüllbar — sonst bräuchte es eine befristete Ausnahmegruppe für rund 92 `box-shadow`-Vorkommen, die genau der Sorte „grünes Gate bei weiterlaufendem Defekt" entspricht, die der v1.2-Audit als untragbar gebrandmarkt hat. Phase 17 ordnet danach nur noch die *Geometrie*. (B-05, COLOR-08, ELEV-01)
- **D-30: Die verbindliche rgba-Zählart ist Vorkommen ohne `variables.css` — 390** — Das Kreuz der vier Zählarten ist gemessen: 375 Zeilen gesamt, 371 Zeilen ohne `variables.css`, 394 Vorkommen gesamt, 390 Vorkommen ohne. Die dokumentierten 390 sind damit korrekt. Die Angabe „173 Werte" ist es nicht: sie zählt exakte Zeichenketten, normiert man Whitespace bleiben **143** — die Differenz sind 30 reine Schreibweisenvarianten. Warum: wer aus 173 einen Tokenbedarf ableitet, plant 30 Tokens zu viel. Folge: REQUIREMENTS COLOR-08 und ROADMAP Phase-16-Kriterium 5 behalten die 390 und korrigieren die Wertezahl. (COLOR-08, BASE-02)

### Tintensatz und Geltungsbereich

- **D-31: Vollständiger `--on-<rolle>`-Satz für neun Akzente, Tinte nur `#000` oder `#fff`** — Neun Rollen mal vier Themes; `#111111` aus PATCHES §1a wird verworfen, weil es gemessen an acht Zellen unter 4,5:1 fällt. Zusätzlich genau zwei abgeleitete Tokens (`--on-gold-dim`, `--on-green-dim`); alle übrigen abgeleiteten Flächen erben die Basistinte. Warum: `--blue` fehlt in der Achter-Aufzählung von COLOR-02, trägt aber zwei `color: white`-Stellen — der Satz braucht neun Rollen. Der Richtungswechsel betrifft gemessen sieben von 36 Zellen, nicht drei. (B-03, COLOR-02)
- **D-32: GATE-04 ist eine Checkliste über sechs Befundgruppen** — Mitgenommen werden: rgba außerhalb CSS (die vier Stellen mit echtem Theme-Gewinn), font-size (39 in 6 Templates + 108 in JS ohne `loader.js`), font-weight (nur die von TYPO-05 wörtlich verbotenen `bold`/`normal`, 3 Stellen). Datierte Restschuld werden: `transition`/`box-shadow` außerhalb CSS (gemessen kommt `transition: all` dort **null** mal vor), Hex-Farbliterale außerhalb CSS (148 streng gemessen), und die fehlende Werkzeugleisten-Absicherung. GATE-04 ist erst setzbar, wenn jede der sechs Gruppen entweder eine Phase oder eine Übertragszeile trägt. Warum: ein grünes Gate bei rund 170 weiterlaufenden Fundstellen ist genau das Muster, das der v1.2-Audit verworfen hat. (B-10, GATE-04)
- **D-33: Die Restschuld wird nach dem v1.2-Vorbild geführt** — Eine Tabelle `### Übertrag aus v1.3 (weiterhin offen)` in `PROJECT.md` neben der bestehenden v1.2-Tabelle, mit dem Messbefehl samt Zahl im Kern-Feld. Warum: die v1.2-Tabelle trägt den Einleitungssatz „hier als Übertrag, damit es das Archivieren überlebt" — dieselbe Mechanik, kein neues Format. (B-10, GATE-04)
- **D-34: Sieben harte Ausnahmen, davon fünf neu benannt** — Bestätigt: `features/shops/shop-export.js` (die **ganze** Datei — eigenständiges `<!DOCTYPE html>`-Dokument, gemessen null `var(--…)`-Zugriffe, 17 `font-size` davon 5 in `pt` und ausschließlich unter `@media print`) und der Editor-Marker (`ui/editors/rich-text.js:519`, `MARKER_TEXT_COLOR`, durch CLAUDE.md ausdrücklich geschützt). Neu: der Theme-Wähler in `modals-tools.html` (vier Farbfelder, die die Farben der jeweils *anderen* Themes zeigen müssen — Tokenisierung ist strukturell unmöglich), alles von `tools/sync-editor-toolbars.js` Generierte, `loader.js`, `index.html` Zeile 6 (`theme-color`-Meta kann keine CSS-Variable annehmen), und `wiki-crud.js:495`. Ausgeschieden: `sw.js` ist in allen fünf Merkmalsgruppen bei null und braucht keine Ausnahme. (B-10, GATE-04)

### Schatten, Bewegung, Gewicht (Ausführung: Phasen 17 und 18)

- **D-35: Höhenstufen als vollständige Schatten-Kurzform je Theme-Block, Farbe über `--shadow-ink`** — `--elev-1/-2/-3` werden komplett (Geometrie und Farbe) in jedem der vier Theme-Blöcke definiert, nicht aus einem einzigen `--shadow` abgeleitet; die Farbe kommt per `color-mix` über `--shadow-ink`, nicht als Zahlentripel. Warum: ein einziges `--shadow` kann drei Höhenstufen nicht bedienen; und weil die Tokens keine rgba-Literale tragen, braucht `variables.css` keine Ausnahme vom rgba-Ausdruck (D-28). Die Deckkraftwerte sind gesetzt, nicht gemessen — sie sind sichtprüfungspflichtig. (B-08, ELEV-01)
- **D-36: Das Contrast-Theme bekommt eine deckende Kante, die weiße Inversion wird nicht freigegeben** — Warum: `variables.css` setzt dort `--shadow: rgba(255,255,255,0.1)`; alle 58 heute schwarzen Schatten würden zu Halos. Ein Theme namens „Hoher Kontrast" braucht eine harte Kante, keinen weichen Schein. (B-08, ELEV-02)
- **D-37: Ring und Glühen sind zwei Tokens, `@keyframes` bleiben ausgenommen** — `--ring-gold` (Blur 0, Spread) und `--glow-gold` (weicher Schein) statt eines Sammel-Tokens; die Sonderfälle werden nach vier Behandlungsarten geregelt statt einzeln verhandelt, `dice.css:598/599` ausdrücklich ausgenommen. Die Zahl der Sonderfälle ist mit 22 zu niedrig angesetzt — die deterministische Klassifikation aller 88 `box-shadow`-Deklarationen ergibt rund 40; ELEV-04 und Phase-17-Kriterium 1 werden entsprechend nachgezogen. (B-08, ELEV-03, ELEV-04)
- **D-38: Standard-Übergangsliste mit acht Eigenschaften, `visibility` nur an einer Stelle** — `background-color, border-color, color, opacity, transform, box-shadow, filter, text-shadow`; die `visibility`-Variante bekommt genau ein Overlay (`dice.css:603`, Floating Dice Panel). Warum: die vorgeschlagene Fünferliste lässt genau die Eigenschaften weg, die unter `transition: all` die sichtbare Arbeit leisten. Von den behaupteten drei ein-/ausblendenden Overlays trifft gemessen nur eines zu — `dashboard.css:2317` deklariert weder `opacity` noch `visibility`, und `dmscreen.css:1017` ist der PWA-Block, der ohnehin gelöscht wird. (B-09, MOTION-01, MOTION-02)
- **D-39: `--ease` wird eingeführt, aber als `ease` definiert** — Die Kurve `cubic-bezier(0.2, 0, 0.2, 1)` wird **nicht** app-weit übernommen; der abweichende Übergang `dice.css:621` wird eingefaltet, sodass danach genau eine Kurve im Baum existiert. Warum: MOTION-04 wäre eine app-weite Änderung des Bewegungsgefühls, die in keinem der drei Handoff-Dokumente als Folge benannt ist. Der Kurvenwechsel wird als eigener, sichtprüfungspflichtiger Punkt zurückgestellt. Drei Dauer-Tokens: `--dur-fast: 150ms`, `--dur: 200ms`, `--dur-slow: 300ms`. (B-09, MOTION-03, MOTION-04)
- **D-40: Übergänge laufen über Custom Properties, nicht über eine Utility-Klasse** — Warum: eine CSS-Klasse verlangte Änderungen an rund 163 Elementen in Templates und JS und sprengte den CSS-only-Rahmen der Welle. (B-09)
- **D-41: Zielwert für das Gewicht 500 ist 600, die Ausführung bleibt außerhalb v1.3** — Warum: die Handoff-Begründung ist widerlegt — gemessen rendert 500 unter Windows/Chromium mit dem echten UI-Stack **pixelidentisch wie 600**, nicht wie 400. Die Ausführung bleibt, wo REQUIREMENTS sie hingelegt hat (TYPO-07 deferred, TYPO-05 nimmt 500 aus); diese Entscheidung legt nur den Zielwert fest und korrigiert die Begründung im Deferred-Eintrag. Die eine 300er-Stelle (`party.css:1433`) wird auf 400 gesetzt, ohne dauerhafte Ausnahme. (B-11, TYPO-05, TYPO-07)
- **D-42: `declarationsOf()` bekommt den `fonts.css`-Ausschluss in Phase 15** — Warum: die vorgeschlagene Gewichts-Ratsche schlüge heute **und** nach vollständiger Umsetzung fehl, weil `declarationsOf()` `fonts.css` mitliest (`inter-500`, `poppins-500` als `@font-face`). Der Ausschluss ist Vorarbeit, keine Freigabe — die Ratsche wird nicht geschrieben, solange TYPO-07 zurückgestellt ist. (B-11, GATE-03)

### Fokus und Zähler (Ausführung: Phase 19)

- **D-43: Ein sichtbarer Rahmenwechsel gilt als Ringersatz** — Die 33 `.x:focus { outline: none }`-Stellen bleiben unverändert; die Welle schrumpft auf die wenigen wirklich ringlosen. Warum: gemessen tragen 27 der 33 einen goldenen Ersatz und 5 einen anderen Akzentrahmen — wirklich ringlos ist **eine**. Die im Handoff vorgeschlagene `:where(…)`-Regel wäre ohnehin Nullarbeit gewesen (Spezifität 0-1-0 gegen mindestens 0-2-0). (B-06, UX-02)
- **D-44: Die globale Fokusring-Regel zieht unverändert nach `core.css`** — Sie existiert bereits (`dmscreen.css:1722`, Top-Level); es wird keine zweite danebengestellt. `UX-01`s Forderung, `border-radius` gehöre nicht in die globale Regel, ist gegenstandslos: die Regel enthält ausschließlich `outline` und `outline-offset`. (B-06, UX-01)
- **D-45: Das Kampfwert-Eingabefeld bekommt seinen Fokuszustand am Elternelement** — Warum: das Eingabefeld trägt `border: none`, ein `border-color` zeichnet dort nichts. (B-06, UX-03)
- **D-46: Phase 19 darf keine reparierte Tastaturbedienung behaupten** — Das Abnahmekriterium wird auf nativ fokussierbare Elemente eingeschränkt und trägt einen ausdrücklichen Nicht-Anspruch für die 176 interaktiven `div`/`span` ohne `tabindex`. Warum: der A11Y-JS-Strang ist bewusst abgewählt; ohne diesen Zusatz führte ein grünes Kriterium in die Irre. Die Tastaturprobe der CHECKLISTE wird gestrichen. (B-06, UX-01)
- **D-47: `setViewCount` wandert früh in `renderSpells()` und `renderQuests()`** — Vor dem Leerzustands-Return, nicht ans Funktionsende. Warum: hinter dem frühen Return feuerte es beim Löschen des letzten Eintrags nie — genau der Fehler, den UX-05 beheben soll. `#quests-count` hat dieselbe Lücke. (B-12, UX-05)
- **D-48: Die Filterrückmeldung bleibt erhalten und wird nicht umbenannt** — `#spell-count` („📖 12/318") ist die einzige Rückmeldung über 300+ Zauber und zeigt etwas anderes als `#spells-count`; es bekommt eine eigene Klasse statt Inline-Eigenschaften, deren Größe aus der Typo-Skala kommt und **kein** `em`-Literal ist. `.filter-bar` wird **nicht** umbenannt. Warum: `.filter-chips` existiert im CSS nicht, `.filter-bar` trägt `display:flex; gap; flex-wrap` — die vorgeschriebene Umbenennung bräche das Layout dreier Filterleisten. Eine bewusste Abweichung von einem gebuchten Phaseninhalt. (B-12, UX-04, UX-06)

### Ratschendisziplin und Abnahme

- **D-49: „Beidseitig bewiesen" ist eine ausführbare Checkliste je Ratschentyp** — Schwellwert-Ratsche: Ist-Wert mit dem Ausdruck messen, den der Test ausführt (nicht mit einem grep-Äquivalent); Grenzwert auf N → grün; auf N−1 → rot; zurück auf N → grün; echten Verstoß einfügen → rot; zurücknehmen → grün. Listen-Ratsche zusätzlich mit Verwaisungsprobe. Beide Exit-Codes wandern ins Messprotokoll. Warum: ein grüner Nachlauf allein beweist nichts — das ist die aus Phase 14 gebuchte Lektion (Key Decision „Roter Vorlauf als Pflicht"). (GATE-03)
- **D-50: Der Ausgangswert steht im vorhandenen Kommentarformat, mit Zählart** — Erhebungszeile mit Datum, Richtungssatz („darf nur SINKEN"), begründete Aufschlüsselung des Restbestands, Konstante — plus Verweis auf den Messblock in `15-RATCHET-BASELINE.md` und die Angabe, **wie** gezählt wurde (Zeilen/Vorkommen/Deklarationen). Kein neues Format: `design-consistency.test.js` (F-18/F-19) und `module-test-coverage.test.js` verwenden es bereits. Warum: die Zählart-Angabe ist der Kern — die sechs kursierenden rgba-Zahlen waren keine Widersprüche, sondern vier nie benannte Zählarten. (GATE-03)
- **D-51: Die drei bestehenden Ratschen haben null Spielraum — das ist Planungsgrundlage** — Gemessen stehen `DUBLETTEN_MAX` 0/0, `IMPORTANT_MAX` 105/105 und `INLINE_MAX` 257/257 exakt auf ihrer Grenze. Ein einziges neues `!important`, ein einziges neues `style="` oder eine einzige wiederholte Selektor-Kombination färbt die Suite rot. `IMPORTANT_MAX` misst auf **kommentarfreiem** CSS (105); dieselbe Regex über ungefiltertes CSS liefert 107 — die wahrscheinlichste Quelle künftiger Fehlalarme. `INLINE_MAX` sinkt 257 → 256 in Phase 15 (PWA-Banner) und 256 → 255 in Phase 19; jede Senkung nennt ihren eigenen gemessenen Ausgangswert. (GATE-03, BASE-04)
- **D-52: Von den fünf bedrohten Prüfungen bricht nur eine wirklich** — `F-14` wird im selben Commit wie §1b auf `color: var(--on-gold)` umgestellt. `F-01` bleibt unverändert — Bedingung: die `--*-text`-Rollen gehen in alle vier bestehenden Theme-Blöcke und **nichts Literales** in den Aliasblock (ein literaler Wert dort schlüge alle vier Theme-Blöcke). `F-03` wird von einer Datei- auf eine Zeilenausnahme umgebaut, die Skala bleibt in `rem`. `DUBLETTEN_MAX` und `IMPORTANT_MAX` bleiben unverändert — ihr einziger Bruchgrund (§8) ist durch B-07 gestrichen. Warum: die Ist-Werte wurden mit dem jeweiligen Testausdruck selbst gemessen, nicht aus dem Handoff übernommen. (BASE-04)
- **D-53: Dreistufige Abnahme, menschliche Vollrunde nach den Phasen 16, 17 und 18** — Stufe 1 automatisch nach jeder Welle (alle Suiten, beide Builds, GATE-01-Harness über vier Themes); Stufe 2 Screenshot-Serie über die Stellenliste der Welle mal vier Themes; Stufe 3 menschlich — volle Runde nach 16/17/18, gezielte Stellenliste nach 15 und 19. Warum: fünf Wellen mal vier Themes vollständig von Hand ist für einen Einzelentwickler nicht durchhaltbar, und eine Abnahme, die nicht durchgehalten wird, schützt nichts. Die Absenkung wird als ausdrückliche Abweichung gebucht und ROADMAP-Erfolgskriterium 5 entsprechend umformuliert — nicht stillschweigend unterlaufen. (GATE-05)
- **D-54: Der Harness deckt Messbares ab, nicht Urteile** — Abgedeckt: Kontrastverhältnisse, Tokenwerte je Theme, `color-scheme`, berechnete `font-size` und `box-shadow`, die Property-Mengen der vier Theme-Blöcke, Verhalten unter emuliertem `prefers-reduced-motion`. Nicht abgedeckt und deshalb bei Stufe 3: ob ein Schatten noch ablösend *wirkt*, ob eine Größenvereinheitlichung eine dichte Zeile unleserlich macht, Bewegungsgefühl, Hover- und Fokuszustände über Zeit. (GATE-05, GATE-01)
- **D-55: Die Testzahlen der Roadmap sind korrekt und bleiben als datierter Ausgangswert stehen** — Gemessen: Playwright 354 Fälle in 31 Dateien (352 passed, 2 skipped), Jest 1217 über 53 Suiten, `design-consistency` 64, `pytest tests/build` 24. Der Streit 354-gegen-344 war eine Zählartvermischung: 344 sind Deklarationen, 354 ausgeführte Fälle; die Differenz von exakt 10 entsteht an drei `for`-Schleifen. Die zwei Skips sind imperative Laufzeit-Skips in `pwa.spec.js` (PWA-Manifest und Service Worker brauchen http/https). Statt die Zahlen durch die Phasen fortzurechnen, nennt jede Phase ihre eigenen neuen Tests namentlich und misst ihren Endstand selbst — die Kettenrechnung über drei Phasen war die Fehlerquelle, nicht die Zahlen. (GATE-03, BASE-02)

### Claude's Discretion

Der Nutzer hat die Auswahl der Diskussionsbereiche abgebrochen und anschließend angewiesen:
„Führe alle Bereiche nach deinen Empfehlungen aus." Sämtliche Entscheidungen oben sind damit
Claude-Ermessen unter dieser ausdrücklichen Anweisung. Sie sind bewusst als *Entscheidungen*
formuliert, nicht als Vorschläge — jede nennt genau eine gewählte Option mit Begründung, damit
die Phasen 16–19 nicht erneut fragen müssen. Vier Punkte verdienen dennoch eine ausdrückliche
Bestätigung durch den Nutzer, weil sie sichtbares Verhalten oder seine eigene Arbeitslast
betreffen: **D-53** (weniger händische Abnahmerunden), **D-43** (goldener Rahmen statt Fokusring),
**D-39** (Bewegungsgefühl bleibt unverändert) und **D-41** (Gewicht 500 bleibt in v1.3 unangetastet).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Befundlage und Entscheidungsgrundlage
- `.planning/HANDOFF-V2-VERIFIKATION.md` — Urteil über den Handoff, die 13 Blocker B-01..B-13, 36 korrigierte Kennzahlen, 16 vom Audit übersehene Befunde. **Wo der Handoff dieser Datei widerspricht, gilt diese Datei.**
- `.planning/HANDOFF-V2-GEGENPROBEN.md` — 40 Einzelbefunde aus vier adversarischen Linsen
- `.planning/REQUIREMENTS.md` — die 46 v1.3-Requirements; § „Future Requirements" enthält den abgewählten A11Y-Strang
- `.planning/PROJECT.md` § Key Decisions und § Blocker-Entscheidungen v1.3 — die gebuchten Entscheidungen (nach D-01 anzulegen)
- `.planning/ROADMAP.md` § Phase 15..19 — Goal, Depends-on und Success Criteria je Phase

### Der externe Handoff (Quelle, nicht Autorität)
- `Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/BEFUNDE-v2.md` — die 9 Befunde N-01..N-09
- `Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/PATCHES.md` — die Rezepte; §8 ist nach D-05 als VERWORFEN markiert
- `Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/CHECKLISTE.md` — zugleich Abnahmevorschrift; beim `transition: all`-Widerspruch gilt nach D-06 der grep

### Projektregeln, die Entscheidungen begrenzen
- `CLAUDE.md` § Conventions — Editor-Marker (fester dunkler Wert ist Absicht), execCommand-Schranke, Werkzeugleisten-Generator, Sanitizer-Erlaubnisliste
- `CLAUDE.md` § Gotchas — `loader.js` als alleinige Modulliste, `assets/styles.css` als CSS-Kaskadenquelle
- `CLAUDE.md` § Live-Sync Pattern — `registerPostSaveHook`, niemals `window.save` wrappen

### Testnetz und Abnahme
- `tests/unit/design-consistency.test.js` — das 64-Test-Netz F-01..F-19; Ratschen bei Z.897/898/940; liest CSS-**Quelldateien** (Z.21-25), nie berechnete Werte
- `tests/unit/__snapshots__/dmscreen-characterization.test.js.snap` — eingefrorenes DM-Screen-Markup (Phase-13 D-04); begrenzt FIX-01 auf CSS-seitige Änderungen
- `.planning/milestones/v1.2-phases/14-tests-gates/14-GATE-BASELINE.md` — Formvorbild für `15-RATCHET-BASELINE.md`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`tests/unit/design-consistency.test.js`** — Vorbild für jede neue Ratsche: Kommentarformat, `withoutComments()`-Vorfilter, `declarationsOf()`, `sourceJs()` (Z.283-297, definiert den JS-Geltungsbereich für D-32, ohne einen neuen Baumlauf zu erfinden)
- **`.slot-pip` / `.slot-pip.filled` / `.slot-pip:hover`** (`dashboard.css:1320/1335/1340`) — gestylt, Top-Level, handler-kompatibel; die Zielfamilie für D-14
- **`.fdp-number.crit`** (`dice.css:685`) — das funktionierende Vorbild, an das D-16 die Hauptansicht angleicht
- **`var(--attr-str|dex|int|wis|cha)`** — die kanonische Attributpalette aus dem Attribut- und Rettungswurf-Widget; Ziel von D-13
- **`--ra-*-rule`-Tokens** — tragen bereits bitgenau die Randfarben der sechs `.read-aloud`-Varianten; keine neuen Glüh-Tokens nötig
- **`npm run globals:generate`** (`package.json:26`) — der vorgesehene Weg, `eslint.generated-globals.js` nach einer Funktionslöschung neu zu erzeugen

### Established Patterns
- **Non-ESM, globaler Scope** — kein `import`/`export`; `loader.js` `MODULES` ist die alleinige Modulliste, `build.py` liest sie und bricht hart ab
- **Ratschen als datierte, sichtbare Ausnahmelisten** statt globaler Schwellen (v1.2 Key Decision) — D-28 und D-32 folgen dem
- **Restschuld sichtbar und datiert führen** (`PROJECT.md` § Übertrag aus v1.2) — Vorbild für D-33
- **Vier Theme-Blöcke in `variables.css` tragen je 21 Properties**, perfekt symmetrisch; der Aliasblock ist ein *fünfter*, separater Block — nicht einer der vier
- **`color-mix` ist bereits etabliert** (13 Nutzungen gegen 6 `-rgb`) — D-27 verstärkt einen vorhandenen Weg, statt einen neuen einzuführen

### Integration Points
- `assets/styles.css` — der `@import`-Hub bestimmt die Kaskadenreihenfolge; `core.css` liegt an Position 3, `dmscreen.css` an 12, ein Umzug dorthin bewegt eine Regel also **nach vorn** (D-18)
- `ui/event-delegation.js:95-97` — bildet `ctx.id`/`ctx.value` ausschließlich aus `data-id`/`data-value`; jedes neue klickbare Markup muss diese Namen tragen (D-14)
- `core/constants.js` `CALL_ACTION_WHITELIST` — verwaist mit gelöschtem Markup (D-22)
- `tools/sync-editor-toolbars.js` — schreibt 22 Leisten in 7 Templates; handgeänderte Leisten werden beim nächsten Lauf überschrieben

### Gemessene Defekte, die kein Dokument nennt
- **Der Party-Zauberplatz-Pip ist ein Klick-Nulleffekt** — nicht nur unsichtbar: `toggleSpellSlot(null, NaN)` bricht in Zeile 37 still ab (D-14)
- **`renderSpellSlotPips`** (`spellslots-ui.js:59`) hat **null** Aufrufstellen; im gebauten Bündel kommt der Name genau einmal vor, als Definition
- **Es gibt eine dritte, voll funktionsfähige Pip-Familie** — `.init-slot-box` (`features/initiative.js:87-93`, gestylt in `initiative.css`)
- **Der Werkzeugleisten-Wächter existiert nicht** — `tools/sync-editor-toolbars.js:18` nennt `tests/unit/editor-toolbar-sync.test.js`; die Datei gibt es nicht, und kein CI-Schritt fährt `--check`. `CLAUDE.md` wiederholt die Behauptung. Der aktuelle Stand ist synchron (22/22 schreibfrei geprüft), aber nichts hält ihn so
- **`.skeleton` ist tot** — 12 von 12 Treffern im Quellbaum liegen in `dmscreen.css` selbst
- **`CLAUDE.md` nennt 13 modulare CSS-Dateien** — gemessen sind es 20 (`ls assets/styles/*.css`, und 20 `@import` im Hub)

</code_context>

<specifics>
## Specific Ideas

- **Prüfspur vor Kosmetik.** Verworfenes wird als verworfen markiert, nicht entfernt (D-05). Dieses Projekt verdankt seinen wichtigsten Fund genau der Praxis, eine externe Behauptung neben ihrer Widerlegung stehen zu lassen.
- **Eine Zählart je Zahl.** Sechs kursierende rgba-Zahlen erwiesen sich als vier nie benannte Zählarten, nicht als Widersprüche. Jede Ratsche trägt deshalb nach D-50 ihre Zählart im Kommentar.
- **Die Reparatur folgt dem funktionierenden Vorbild.** FIX-03 gleicht die Hauptansicht an das Floating-Panel an; FIX-02 an die bereits gestylte und handlerkompatible Familie. Keine zweite Regelfamilie, wo eine funktionierende existiert.
- **Der Nutzer ist der Tester.** Einzelentwickler, Spielleiter am Tisch, Windows/Chromium, `file://` und PWA. Eine Abnahme, die er nicht durchhält, schützt nichts — daher D-53.

</specifics>

<deferred>
## Deferred Ideas

- **Kurvenwechsel `--ease` auf `cubic-bezier(0.2, 0, 0.2, 1)`** — app-weite Änderung des Bewegungsgefühls; D-39 führt das Token ein, aber mit dem Wert `ease`. Der Wechsel braucht eine eigene Sichtprüfung und gehört in einen späteren Milestone.
- **`font-weight: 500` → 600 ausführen** — Zielwert ist nach D-41 entschieden, die Ausführung bleibt bei TYPO-07 (zurückgestellt: 285 Stellen Handarbeit ohne Abnahmekriterium). Sichtbar wird sie ohnehin erst auf macOS/SF Pro und Android/Roboto, wo 500 einen echten Schnitt hat.
- **Hex-Farbliterale außerhalb `assets/styles/`** — 148 streng gemessene Stellen, von keinem Requirement gedeckt. Als datierte Restschuld nach D-33 buchen. Achtung bei der Nachmessung: die naive Regex trifft in diesem deutschsprachigen Projekt HTML-Entities — 27 vermeintliche Treffer in `migration-wizard.js` und 15 in `view-bestiary.html` sind Umlaute (`&#246;`, `&#228;`, `&#223;`).
- **Wächtertest für die generierten Werkzeugleisten** — ein Jest-Test oder CI-Schritt, der `tools/sync-editor-toolbars.js --check` fährt. Existiert nicht, wird aber von zwei Stellen behauptet. Die Behauptungen korrigiert Phase 15 (D-32); der Test selbst ist Restschuld.
- **`renderSpellSlotPips` als toter JS-Code** — nach D-14 endgültig ohne Aufrufer. DEAD-01..03 sind ausdrücklich auf `assets/styles/` beschränkt, also bleibt er stehen. Ein JS-Löschlauf ist ein eigenes Vorhaben.
- **Die dritte Pip-Familie vereinheitlichen** — `.init-slot-box` in der Initiative sieht anders aus als `.slot-pip` auf der Charakterkarte. Beide funktionieren; die Vereinheitlichung ist Gestaltung, kein Defekt.
- **Trefferflächen für den Tisch** — `.slot-pip` misst 18×18 px, mit Erweiterung 26×26 px. Das liegt unter der 44-px-Empfehlung für Touch. Eine echte Vergrößerung ist eine Gestaltungsfrage für eine eigene Welle.
- **Neun ungestylte `dms-*`-Klassen bleiben nach FIX-01 stehen** — `dms-dc-mini`, `dms-econ-icon`, `dms-econ-val`, `dms-economy-header`, `dms-know-skill`, `dms-know-types`, `dms-ritual-item`, `dms-ritual-list`, `dms-save-desc`. Derselbe Defekt, andere Widgets; die Ratsche aus D-17 hält die Zahl fest, damit sie nur sinken kann.
- **Tastatur-Erreichbarkeit als JS-Strang (A11Y-01..06)** — vom Nutzer beim Milestone-Aufsetzen abgewählt. 176 interaktive `div`/`span` ohne `tabindex`, 58 Chips mit `display:none`-Eingabe, 35 von 36 Modalen ohne Fokusverwaltung. D-46 stellt sicher, dass Phase 19 das nicht als erledigt ausgibt.

</deferred>

---

*Phase: 15-Befundlage & Vorlauf*
*Context gathered: 2026-09-08*
