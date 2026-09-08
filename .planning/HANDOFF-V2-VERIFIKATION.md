# Verifikation des Design-Handoffs v2 (Welle 4-6)

**Erhoben:** 2026-09-08 gegen HEAD `1aba0ac` · 14 Agenten, 797 Werkzeugaufrufe
**Gegenstand:** `Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/` (BEFUNDE-v2.md, PATCHES.md, CHECKLISTE.md)
**Methode:** jede Zahl des Berichts mit einem eigenen Kommando gegen den Live-Quellstand nachgemessen; zusaetzlich vier adversarische Gegenproben auf das, was der Bericht *nicht* nennt.

> Dieses Dokument ist die **korrigierte Befundlage**. Wo es dem Handoff widerspricht, gilt dieses Dokument — jede Abweichung traegt das Kommando, mit dem sie gemessen wurde.

---

## Urteil

NEIN — der Handoff ist als Abnahmegrundlage brauchbar, als Ausführungsanweisung nicht. Die Diagnosen tragen (N-02 rechnerisch tadellos: alle 48 Tabellenzellen und 21 Zielwerte exakt; N-01, N-03, N-04, N-06, N-07 in der Richtung belegt), aber die Rezepte sind an sieben von neun Befunden defekt, und ein Befund (N-08) ist widerlegt. Eigene Messungen gegen HEAD 1aba0ac bestätigen die Kernzahlen 390 rgba-Literale, 88 box-shadow-Deklarationen, 163 `transition: all`, 784 em-Schriftgrößen, 37 `outline: none`, 100 `color: var(--bg-dark)`, 105 !important, 64/64 grüne Tests. Wer die CHECKLISTE von oben nach unten abarbeitet, produziert: (a) eine rote Testsuite ab dem ersten Patch (F-14 verlangt wörtlich das `color: var(--bg-dark)`, das §1b entfernt; F-01 bricht an der in §2b vorgeschriebenen Blockreihenfolge; F-03 verbietet die rem-Literale, die §5a einführt; DUBLETTEN_MAX=0 bricht an §8; IMPORTANT_MAX steigt auf 110 statt der angewiesenen 109); (b) mindestens fünf messbare Verschlechterungen (.btn-gold:hover Light 4,67→3,71; .btn-success:hover in drei Themes durchgefallen; Floating-Dice-Panel verliert die Schließanimation; Wuerfelknoepfe verlieren die einzige Hover-Rückmeldung; die Zauber-Filterleisten verlieren ihr Flex-Layout); (c) drei Nullarbeiten (§7a ist wegen Spezifität an 33 von 37 Stellen wirkungslos, §7b greift auf `border: none`, §8 dupliziert einen seit Langem vorhandenen globalen Block). Der Umfang ist zudem systematisch zu klein angegeben — N-02 um Faktor 20 (97 statt „fünf weitere Stellen"), N-01 deckt 249 von 390 Fundstellen ab, während die Ratsche exakt null verlangt. Empfehlung: Handoff als Befundlage übernehmen, PATCHES.md und CHECKLISTE.md vor der ersten Zeile Code neu schreiben, N-08 schließen, und eine Welle 0 (Zahlenkorrektur, Ratschen-Vorbereitung, Löschen von rund 11,7 % totem CSS) vorschalten.

### Einzelurteile

| Befund | Urteil | Kern |
|---|---|---|
| **N-01** | teilweise | Der Kern des Befundes haelt stand und ist eher unter- als uebertrieben — aber zwei der fuenf Farbzahlen und die Nutzungszahl der -rgb-Tokens reproduzieren nicht, und der Patch deckt nur 249 der 390 Fundstellen ab, waehrend die Checkliste null verlangt. |
| **N-02** | teilweise | Die Kontrastdiagnose haelt vollstaendig stand — alle 48 Tabellenzellen und alle 21 Zielwerte in PATCHES.md §1a/§2b sind exakt nachgerechnet richtig; das Rezept dagegen ist an mehreren Stellen defekt: es unterschaetzt den Umfang um das Zwanzigfache (97 statt "fuenf weitere Stellen"), bricht zwei heute gruene Tests, erzeugt drei messbare Kontrast-Regressionen und gibt fuer 27 Fundstellen entweder gar keine oder eine nachweislich falsche Regel. |
| **N-03** | teilweise | Die Diagnose stimmt im Kern — 88 Schatten-Deklarationen, 58 mit hartem Schwarz, var(--shadow) genau einmal benutzt —, aber die Zahl "66" ist ein Zeilenumbruch-Artefakt (real 65), die "58 davon" mischen Deklarationen mit Werten, zwei der drei angeblich dokumentierten Sonderfälle existieren nicht, und die Vier-Stufen-Zuordnung in §4b lässt 22 von 88 Deklarationen ohne Ziel. |
| **N-04** | teilweise | Die Diagnose stimmt und ist sogar zu vorsichtig — gemessen 784 statt ~740 em-Fundstellen und ein real gerenderter Kleinstwert von 7,70px —, aber die zentrale Kausalbehauptung zum Mobil-Profil ist falsch und die Voraussetzung des Patches (§5a) trifft nicht zu: weder html noch body tragen heute `font-size: var(--font-size-base)`, die rem-Skala löst also gegen 16px statt 14px auf. |
| **N-05** | teilweise | Die drei Zahlen (37/7/45) stimmen exakt, aber die Diagnose nennt zwei von fünf angeblich ringlosen Bauteilen falsch, verschweigt die bereits vorhandene globale :focus-visible-Regel — und der vorgeschlagene Patch ändert nachweislich an keiner einzigen Stelle etwas. |
| **N-06** | teilweise | Die Kernzahlen von N-06 stimmen exakt (132 / 19 / 58 / 195 / 62 / 21 / 14 / 13), aber die Gesamtzahl der `all`-Übergänge ist 163 statt der in CHECKLISTE.md genannten 151, die begründende Ursachen-Erzählung (Layout-Sprünge beim Auf-/Zuklappen) hat im Repo keinen einzigen Beleg, und die vorgeschlagene Fünf-Eigenschaften-Ersetzung lässt `opacity`, `visibility`, `filter` und `text-shadow` fallen — das sind mindestens elf stille Regressionen. |
| **N-07** | teilweise | Die Diagnose (Gewichts-Inflation) stimmt der Richtung nach, aber jede einzelne Zahl ist um die !important-Faelle zu niedrig, die tragende Begruendung ueber assets/fonts/ ist falsch, weil die UI gar keine der gebuendelten Schriften benutzt, und die vorgeschlagene Test-Ratsche kann in diesem Repo nicht gruen werden. |
| **N-08** | widerlegt | Die drei Zahlen (19/29/4) stimmen exakt, aber die Diagnose ist falsch: ein globaler `*, *::before, *::after`-Block mit genau den drei Deklarationen des Patches existiert bereits seit Langem in `assets/styles/dmscreen.css:1408-1414` und wirkt app-weit — der Patch ist eine Dublette, die zwei bestehende Ratschen-Tests rot macht. |
| **N-09** | teilweise | Die Kernbeobachtung (zwei Zähler, Inline-Stil, abweichender Klassenname) ist Zeile für Zeile bestätigt — aber zwei Belegsätze des Berichts sind falsch und beide vorgeschlagenen Fixes erzeugen wörtlich ausgeführt eine Regression. |

---

## Blocker — vor der ersten Zeile Code zu entscheiden

### B-01

**Problem:** N-04/§5a: „html { font-size: var(--font-size-base); } bzw. body" ist keine Alternative, sondern eine Entscheidung mit 14,3 % Größenunterschied — rem löst ausschließlich gegen das Wurzelelement auf. Und die Voraussetzung existiert nicht: es gibt 0 html-Selektoren in assets/styles/, core.css:284 body{} setzt keine font-size, gemessen ist die Basis in BEIDEN Layout-Profilen 16px. Die Wurzelregel allein — ohne eine einzige em-Ersetzung — ändert 3.431 von 5.032 Elementen und hebt die Zahl der Elemente unter 11px von 169 auf 326, weil der geerbte Fließtext (1.305 Elemente auf 16px) in der Zuordnungstabelle §5b gar nicht vorkommt.

**Betrifft:** 1.078 Bearbeitungsstellen in 19 CSS-Dateien; jede Zahl im §5a-Kommentar (11/12/14/16/20/26/34px); das Mobil-Verhalten der gesamten App

**Empfehlung:** Vor der ersten Ersetzung schriftlich festlegen: (a) html, nicht body; (b) die Wurzel bei 16px BELASSEN und die --text-*-Werte gegen 16 rechnen (xs 0.6875rem, sm 0.75rem, md 0.875rem, lg 1rem …). Das liefert dieselbe Skala ohne Globalschrumpfung und hält die Browser-Grundschriftgröße des Nutzers intakt; (c) getrennt entscheiden, ob der Profilwechsel künftig die ganze Oberfläche um 14,3 % skalieren soll — das wäre neu. §5a und §5b müssen atomar in einem Commit landen; ein dateiweiser Rollout ist mit einer Wurzeländerung nicht möglich.

### B-02

**Problem:** Zwei heute grüne Ratschen und eine dritte Regel werden von den Patches gebrochen, ohne dass der Handoff es erwähnt — obwohl die CHECKLISTE nach jeder Welle `npm test` verlangt: F-14 prüft wörtlich `color: var(--bg-dark)` in .btn-primary (§1b entfernt genau das); F-01 prüft, dass der Aliasblock nach allen [data-theme]-Blöcken steht (§2b schreibt zwei neue [data-theme]-Blöcke dahinter vor); F-03 verbietet rem-Literale außerhalb fonts.css (§5a legt 7 davon in variables.css); DUBLETTEN_MAX = 0 bricht an §8; IMPORTANT_MAX = 105 steigt auf 110 statt der angewiesenen 109.

**Betrifft:** Jede Welle. Ab dem ersten Patch ist die Suite rot und bleibt es — mit der realen Gefahr, dass die Tests im Rotlauf entschärft statt nachgeführt werden.

**Empfehlung:** Welle 0: für jede der fünf Ratschen vorab entscheiden, ob sie mitgeändert oder der Patch umgebaut wird. Für F-01 ist die bessere Antwort, die -text-Übersteuerungen INNERHALB der bestehenden Theme-Blöcke zu setzen statt in neuen Blöcken hinter dem Alias — das vermeidet Testbruch und Reihenfolgeproblem zugleich. Für F-03 entweder eine begründete Ausnahme für den Token-Block oder die Skala in px. Jede Ratschenzahl VOR dem Umbau mit demselben Ausdruck messen, den der Test später benutzt.

### B-03

**Problem:** N-02: die Tinten-Systematik ist unvollständig und an vier Stellen nachweislich falsch. --on-gold/--on-green decken nur 66 der 97 Fundstellen; für --cyan (13), --yellow (4), --orange (4), --purple (1), --pink (1) gibt es keine Regel; für --red (4) ist die Patch-Regel („--on-accent bleibt") gemessen falsch (Weiß auf --red: 3,76 in Dark, 4,00 in Contrast). Zusätzlich ignoriert der Patch die ABGELEITETEN Flächen: .btn-gold:hover fällt in Light von 4,67 (bestanden) auf 3,71; .btn-success:hover (dmscreen.css:1487) von durchweg bestanden auf durchgefallen in drei von vier Themes.

**Betrifft:** 97 Bearbeitungsstellen plus alle :hover-Ableitungen; drei messbare Kontrast-Regressionen

**Empfehlung:** Vor §1c einen vollständigen --on-<rolle>-Satz für alle acht Akzente pro Theme festlegen, plus eigene Werte für --gold-dim/--gold-hover/--green-dim, ODER eine explizit dokumentierte Ausnahmeliste. Achtung Richtungswechsel: --on-gold ist in Sepia HELL (#fdf6e3), sonst dunkel — jede abgeleitete Fläche muss pro Theme einzeln geprüft werden.

### B-04

**Problem:** N-01: es stehen zwei Mechanismen für dieselbe Sache zur Wahl, und der Patch entscheidet nicht. Das Projekt führt --gold-rgb/--green-rgb/--red-rgb in allen vier Themes, benutzt sie 6× und erzwingt sie per Test (design-consistency.test.js:62 und :77, F-01); variables.css:22-24 trägt dazu den Wartungskommentar „BEIM ÄNDERN EINER FARBE HIER MITZIEHEN". §3 führt color-mix als zweiten Weg ein, ohne den ersten zu erwähnen, zu erweitern (es gibt kein --yellow-rgb, --cyan-rgb …) oder abzulösen.

**Betrifft:** ~250 Fundstellen; das Ergebnis wäre ein testgeschützter, aber toter Mechanismus plus ein irreführender Kommentar

**Empfehlung:** Eine Mechanik wählen. Bei color-mix: die drei -rgb-Tokens, ihren Test und den Kommentar im selben Commit mit abräumen. Bei -rgb: die Familie auf alle acht Akzente erweitern. Zusätzlich beachten: Chromium serialisiert color-mix als `color(srgb …)`, nicht als `rgba(…)` — im Repo hängen 7 toHaveCSS-Zusicherungen daran (wiki.spec.js:396 und 6 in den Editor-Specs).

### B-05

**Problem:** N-01/N-03 widersprechen sich in ihren eigenen Abnahmekriterien. Das N-01-Kriterium verlangt wörtlich `grep -rn "rgba([[:space:]]*[0-9]" assets/styles/ | grep -v variables.css # leer` und T-2 `expect(treffer).toEqual([])` ohne jede Ausnahme; die N-03-Sonderfälle lassen 23 Zahlentripel stehen (7× .read-aloud mit je zwei, plus fünf rote dice.css-Werte), und T-3 lässt für die Schatten ausdrücklich 3 Ausnahmen zu. Beide Haken können nicht gleichzeitig gesetzt werden. Dazu kommen 141 Fundstellen ohne jede Vorschrift und mindestens 7 Weiß-Fälle, die nicht umgestellt werden dürfen (Marker-Rand auf --purple, Konflikt-Banner-Knopf, Kartenraster, Würfelknopf-Rand, zwei inset-Glanzkanten).

**Betrifft:** 390 rgba-Fundstellen; T-2 ist als Alles-oder-nichts-Gate vor Abschluss aller Einzelfallentscheidungen nicht grün zu bekommen

**Empfehlung:** T-2 auf „leer außer den N benannten, kommentierten Ausnahmen" umformulieren (wie T-3 es tut), die 141 vorschriftslosen Fundstellen vorab klassifizieren (66 palettenfremd, 25 aus fremden Theme-Paletten, 8 schwarze rgba außerhalb box-shadow, 42 sonstige), und die .read-aloud-Töne entweder als --ra-*-glow-Tokens nach variables.css holen oder als Ausnahme eintragen.

### B-06

**Problem:** N-05: der Patch ist nachweislich Nullarbeit. :focus-visible ist eine Teilmenge von :focus; `:where(…):focus-visible` hat Spezifität (0,1,0) und verliert gegen jede der 33 `.x:focus { outline: none }`-Regeln (mindestens (0,2,0)). Im kontrollierten Nachbau MIT Patch bleiben .toolbar-select, .toolbar-search, .cf-combat-value input, #session-tags-input, .cp-input, .bst-rich-editor, .wp-rich-editor Zeichen für Zeichen auf `outline-style: none` — identisch zum Lauf ohne Patch. §7b ist ebenfalls wirkungslos: `.cf-combat-value input` trägt `border: none`, ein `border-color` zeichnet dort nichts. Die einzige messbare Wirkung des Patches wäre ein unbeabsichtigter Formsprung (.nav-tab 12px→4px, .header-action-btn 8px→4px bei Tastaturfokus).

**Betrifft:** 37 Regeln plus die Abnahme-Tastaturprobe der CHECKLISTE, die an 4 von 4 Punkten unerfüllbar ist

**Empfehlung:** N-05 mit umgekehrtem Vorzeichen neu schneiden: (1) die bereits vorhandene globale Regel aus dmscreen.css:1722 nach core.css holen und dort als die eine Weltregel dokumentieren (nicht eine zweite daneben stellen); (2) entscheiden, ob ein goldener Rahmen als Ringersatz gilt — sagt man ja, sind 33 Stellen fertig und die Welle schrumpft auf 5 Edits; sagt man nein, müssen 33 `:focus`-Selektoren auf `:focus-visible` umgeschrieben werden, DAS ist die eigentliche Arbeit; (3) party.css:1485 per box-shadow-Ring oder :focus-within am .cf-combat-stat reparieren; (4) Chips und Listenzeilen als eigenes JS-Vorhaben führen.

### B-07

**Problem:** N-08 ist widerlegt und §8 darf nicht ausgeführt werden. Der globale Block existiert seit Langem (dmscreen.css:1408-1414, Top-Level, in beiden Bundles). §8 legt eine Dublette an (DUBLETTEN_MAX = 0 → 1), hebt !important auf 110 bei angewiesener Grenze 109, und seine Ausnahmeliste trifft nichts (.dice-crit-glow existiert nicht, .dice-result ist tot).

**Betrifft:** 2 Bearbeitungsstellen — aber zwei grüne Ratschen und die Aussage von F-18 („Dubletten zusammengeführt")

**Empfehlung:** §8 streichen. Verteidigbarer Rest: entweder nur eine Ratsche, die den bestehenden Block gegen Rückbau sichert (die in §T-4 vorgeschlagene taugt nicht — ihre Regex matcht 211.080 Zeichen quer über zwei Dateien und ist heute schon grün), oder den vorhandenen Block nach core.css VERSCHIEBEN. `scroll-behavior: auto !important` ersatzlos streichen: alle 16 Scroll-Stellen rufen scrollIntoView({behavior:'smooth'}) mit explizitem Argument, das CSS gewinnt dagegen nie.

### B-08

**Problem:** N-03: der Token-Entwurf trägt nicht. Ein einziges --shadow kann drei Höhenstufen nicht bedienen (Sepia 0.1: --elev-3 für Modale, die heute 0.4-0.6 tragen → das Modal verliert seine Ablösung; Dark 0.5: --elev-1 an .shadow-sm bedeutet dreifachen Blur bei 2,5-facher Deckkraft). Im Contrast-Theme ist --shadow WEISS — alle 58 heute schwarzen Schatten würden dort zu Halos. Und 22 von 88 Deklarationen bilden auf KEINE der vier Zeilen ab: 9 farbige Glühe (purpur/rot/grün), 4 gold getönte Schlagschatten als Zustandsanzeige, 4 Größen zwischen den Tabellenzeilen (u. a. das einzige heute korrekte var(--shadow) in core.css:857), 1 negativer X-Offset (initiative.css:922, seitlich einfahrende Schublade), 2 @keyframes-Zustände (dice.css:598/599, animierter Spread 0→8px).

**Betrifft:** 88 Deklarationen in 16 Dateien; T-3 verlangt ≤ 3 Fremdfälle, real bleiben 23

**Empfehlung:** Vor §4: (a) Deckkraft pro Stufe staffeln (--shadow-1/-2/-3 pro Theme oder Multiplikation per color-mix); (b) Contrast-Theme eigenen Schattenwert geben oder die Inversion ausdrücklich freigeben; (c) --glow-gold aufteilen — Ring (0 0 0 3px) und Glühen (Blur 4-12px) sind zwei Rollen; (d) --glow-green/-red/-purple ergänzen oder als benannte Sonderfälle führen; (e) 6px-Zeile, farbige Elevation und seitlichen Schatten in die Tabelle aufnehmen; (f) @keyframes ausdrücklich ausnehmen; (g) T-3-Schwelle messen statt raten.

### B-09

**Problem:** N-06: die Standard-Eigenschaftsliste `background, border-color, color, transform, box-shadow` lässt genau die Eigenschaften weg, die unter `all` die sichtbare Arbeit leisten — opacity (9 lebende Stellen), visibility (1), filter (2), text-shadow (1). Schwerster Fall: dice.css:603 Floating Dice Panel hält `opacity:0; visibility:hidden; transform:…` und wird per classList.toggle('show') geschaltet — ohne `visibility` greift hidden beim Schließen sofort, das Panel verschwände schlagartig. Zweitschwerster: dashboard.css:54 (acht Würfelknöpfe) und encounters.css:1537 verlieren ihre `filter: brightness()`-Aufhellung, die dort die EINZIGE Hover-Rückmeldung ist.

**Betrifft:** 287 Bearbeitungsstellen; mindestens 11 stille Regressionen; kein Test im Repo prüft Übergänge

**Empfehlung:** Standardliste festlegen als `background-color, border-color, color, opacity, transform, box-shadow, filter`, plus eine zweite Variante mit `visibility` für die drei ein-/ausblendenden Overlays (dice.css:603, dmscreen.css:1017, dashboard.css:2317). Zusätzlich entscheiden: Zuordnung für 0.08s (party.css:2718/2754/2971), die 12 Easing-Varianten, den Sonderfall dice.css:621 (eigene Kurve), und ob `--ease: cubic-bezier(0.2,0,0.2,1)` wirklich die 263 heute impliziten `ease`-Übergänge ersetzen soll — das ist eine app-weite Änderung des Bewegungsgefühls, die in keinem der drei Dokumente als Folge benannt ist. Und klären, was „Utility in core.css" heißt: eine CSS-Klasse verlangt Änderungen an ~163 Elementen in Templates und JS und sprengt den CSS-only-Rahmen; tragfähig ist nur eine Custom Property (`--trans-std`).

### B-10

**Problem:** Geltungsbereich CSS vs. JS/Markup ist nirgends entschieden, und alle Abnahme-greps enden bei assets/styles/. Außerhalb liegen: 7 numerische rgba in JS (render-loot.js 3× das Dark-Grün, wiki-crud.js, rich-text-toolbars.js, utilities.js, shop-export.js) plus 1 Inline-Stil (modals-tools.html:180); 39 Inline-font-size in 6 Templates und 108 in 29 JS-Dateien; 16 font-weight-Stellen (3 Templates, 13 JS). Nach „erfolgreicher" Umsetzung wären alle Ratschen grün, während dieselben Defekte weiterlaufen.

**Betrifft:** ~170 Fundstellen außerhalb des Prüfumfangs; die Glaubwürdigkeit jeder Abnahme

**Empfehlung:** Pro Befund entscheiden: mitnehmen oder als dokumentierte Restschuld ausweisen. Zwei harte Ausnahmen: features/shops/shop-export.js (17 font-size, eigenständiges Druckdokument mit pt-Einheiten ohne Token-Zugriff) darf NICHT umgestellt werden; beim Editor-Marker verbietet CLAUDE.md die Änderung ausdrücklich („der feste dunkle Wert ist Absicht", eingefrorenes Testnetz). Wird ausgeweitet, müssen wiki.spec.js:396 und 6 Editor-Zusicherungen neu verhandelt werden.

### B-11

**Problem:** N-07: der Zielwert für die 49+5 Vorkommen von font-weight 500 ist nicht festgelegt, und die dazu vorgeschlagene Ratsche ist unpassierbar. Messlage: Segoe UI hat keinen 500er-Schnitt, 500 rendert unter Windows bereits als 400 — 500→400 wäre eine Null-Änderung, 500→600 an allen 54 Stellen sichtbar und würde u. a. die Unterscheidung .nav-tab (500) gegen .nav-tab.active (600) in der Hauptnavigation aufheben. Die Ratsche „nur 400/600/700" schlägt heute UND nach vollständiger Umsetzung fehl, weil declarationsOf() fonts.css mitliest (inter-500, poppins-500 als @font-face).

**Betrifft:** 54 Stellen plus die Ratsche; der naheliegende „Fix" (500er-@font-face löschen) würde Inter und Poppins im Editor lautlos auf 400 degradieren

**Empfehlung:** 500 → 400 festlegen (mit ausdrücklicher Kenntnisnahme, dass es auf macOS/SF Pro und Android/Roboto sichtbar wird). Die Ratsche vor dem Schreiben reparieren: denselben fonts.css-Ausschluss verwenden, den der bestehende F-05-Test schon benutzt. 300 (party.css:1433, .cf-hp-divider) einzeln entscheiden — die Begründung des Berichts („fällt ohnehin auf 400 zurück") trägt nicht, Segoe UI Light ist installiert.

### B-12

**Problem:** N-09: beide angebotenen Wege verschlechtern die Ansicht. Die zwei Zähler zeigen NICHT dasselbe (#spells-count = Gesamtzahl, #spell-count = '📖 12/318', die einzige Filterrückmeldung über 300+ Zauber), und #spells-count ist bereits heute stale: saveSpell() und deleteSpell() rufen nur renderSpells() + save(), nicht updateIOCounts(). Zusätzlich bricht die vorgeschriebene Umbenennung .filter-bar → .filter-chips das Layout, weil .filter-chips im CSS nicht existiert und .filter-bar (core.css:1965) display:flex/gap/flex-wrap trägt.

**Betrifft:** 8 Bearbeitungsstellen — klein, aber die Checkliste ist so formuliert, dass die App danach schlechter aussieht

**Empfehlung:** Umgekehrt vorgehen: renderSpells() zusätzlich setViewCount('spells', totalCount) rufen lassen (behebt den Altfehler; quests hat dieselbe Lücke), den Inline-Zähler als Filterrückmeldung BEHALTEN und nur die Inline-Eigenschaften durch eine eigene Klasse ersetzen (.meta-text reicht nicht). Beim Umbenennen die CSS-Regel core.css:1965 zwingend mitziehen. Und die F-10-Ratsche nachschärfen — sie ließ #spell-count durch, weil COUNTED_VIEWS 'spells' kennt, aber nicht 'spell'.

### B-13

**Problem:** Rund 11,7 % des CSS ist tot und wird von jeder Zählung des Audits mitgetragen: 438 tote Klassen in 607 Regelblöcken (~3.174 von 27.141 Zeilen), darunter ein 678-Zeilen-Block „MAP INTEGRATION" (dashboard.css:547-1224) für ein Feature, das im Code nicht mehr existiert (kein Karten-Modul in loader.js, 0 Treffer für map-marker/map-container in JS und HTML). Anteil der gezählten Fundstellen, die in toten Regeln liegen: rgba 13 %, em-font-size 16 %, box-shadow 16 %, transition:all 8 %.

**Betrifft:** Alle Wellen; die CHECKLISTE macht diese Zahlen zu Ratschen-Zielwerten

**Empfehlung:** Vor Welle 4 eine Löschrunde. Sie ist die billigste Maßnahme im ganzen Vorhaben, senkt den Umfang jedes Folgepatches messbar und ist risikoarm (0 Nutzungen im gesamten Quellbaum). Achtung: dynamisch zusammengesetzte Klassennamen (`condition-${…}`) vorher per Präfixerkennung ausnehmen — sonst gibt es Fehlalarme.

---

## Korrigierte Ausgangswerte

| Kennzahl | Bericht | Gemessen |
|---|---|---|
| Kopfzeile: geprüfte CSS-Dateien / Zeilen | 21 Dateien / 27.187 Zeilen | 20 Dateien in assets/styles/ mit 27.141 Zeilen; mit dem @import-Hub assets/styles.css 21 Dateien / 27.166 Zeilen. 27.187 ist in keiner Lesart reproduzierbar. (`ls assets/styles/*.css | wc -l` = 20; `cat assets/styles/*.css | wc -l` = 27141) |
| Kopfzeile: Template-Dateien | 13 | 12 (loader.js TEMPLATES führt ebenfalls 12); 24 Ansichten stimmt |
| N-01: rgba(251,191,36,…) = --yellow | 44× | 32×. Die 44 entstehen bei grep auf "rgba(251" — darin stecken 12× rgba(251,146,60,…) = --orange. Zwei Rollen in einer Zahl. |
| N-01: Verwendungen der --*-rgb-Tokens | 4× | 6× (initiative.css:1294, tools.css:2193/2199, welt.css:156/422/424); nur 4 davon sind background: |
| N-01: rgba(0,0,0,…) | 58× Schatten | 58 in box-shadow, 66 insgesamt (6× background, 1× filter, 1× text-shadow); die 8 übrigen fallen zwischen N-01 und N-03 durch |
| N-01: Anteil der 390 Literale, der wirklich die Dark-Palette ist | implizit alle | 198 von 390 (50,8 %) sind exakt ein Dark-Token. 66 schwarz, 35 weiß, 25 tragen die Palette eines ANDEREN Themes (light --red 11×, contrast --gold 9×, sepia --gold 3×, light --purple 2×), 66 entsprechen gar keinem Token. |
| PATCHES §3b: „die 138 Farb-Auflagen" | 138 | 156 (54+32+40+19+11). Die 138 sind 54+44+40, also die Tabellenzeile mit dem falschen Gelb-Wert. |
| PATCHES §3: „danach bleibt kein Zahlentripel übrig" | vollständige Abdeckung | §3a (35) + §3b (156) + §4 (58) = 249 von 390. 141 Fundstellen haben keine Vorschrift, während T-2 exakt null verlangt und keine Ausnahme kennt. |
| N-02: Kontrastzeile --pink | — / 4,60 / 4,21 / — | 6,57 / 4,60 / 4,21 / 5,00. --pink IST in allen vier Themes definiert (dark #f472b6 Z.16, contrast #ff0080 Z.97); die zwei Gedankenstriche sind sachlich falsch. |
| N-02: Vollständigkeit der Tabelle | 12 Zeilen, --red kommt nicht vor | --red auf --bg-card ergibt Sepia 4,29 und unterschreitet — die Zeile fehlt. PATCHES §2b definiert dafür sehr wohl --red-text: #da2825. |
| N-02 Fließtext: „Primäraktion und Speichern-Knopf in Light UND Sepia grenzwertig" | beide Knöpfe in beiden hellen Themes | Die Primäraktion (Gold) fällt nur in Light durch (2,98); in Sepia erreicht sie 5,65. Nur .btn-success fällt in beiden hellen Themes durch (3,02 / 2,55). Die Tabelle sagt es richtig, nur der Satz darüber nicht. |
| PATCHES §1c: „dieselbe Ursache an fünf weiteren Stellen" | 5 | 97. Eigene Messung: 100 echte `color: var(--bg-dark)`-Deklarationen (der im Patch abgedruckte grep liefert 101 Zeilen, davon 1 Fehltreffer auf `background-color`), minus die 3 Buttons aus §1b. Verteilung: gold 45, green 21, cyan 13, yellow 4, orange 4, red 4, purple 1, pink 1, gold-dim 1, ohne Hintergrund 5. |
| PATCHES §2c: Arbeitsliste per grep | implizit: die Trefferliste ist die Arbeitsliste | 715 Treffer, davon 229 Fehltreffer auf `border-color: var(--…)` — genau die Eigenschaft, die der Patch zwei Zeilen darüber ausschließt. Echte color:-Deklarationen: 482. |
| N-03: verschiedene box-shadow-Werte | 66 | 65 nach Leerraum-Normalisierung (dice.css:575 und :598 sind derselbe Wert, einmal umbrochen). 88 Deklarationen insgesamt. Eine Ratsche auf 66 hinge an einer Formatierung. |
| N-03: „58 davon mit hartem rgba(0,0,0,…)" | 58 der 66 WERTE | 58 DEKLARATIONEN, aber nur 39 verschiedene Werte. Zahl richtig, Einheit falsch. |
| N-03: --shadow „in allen vier Themes passend (rgba(0,0,0,0.5) bis rgba(0,0,0,0.1))" | vier Schwarztöne | variables.css:101 [data-theme="contrast"] --shadow: rgba(255,255,255,0.1) — WEISS. Der gesamte §4-Vorschlag baut jede Höhenstufe darauf; im Contrast-Theme würden aus 58 schwarzen Schatten weiße Halos. |
| N-03: die drei „dokumentierten Sonderfälle" | Statblock-Pergament, Würfel-Glühen, Fortschrittsbalken-Innenschatten | Zwei existieren nicht. Alle 7 inset-Schatten sitzen auf .read-aloud (party.css:390-438); bestiary.css hat 0 box-shadow. Es gibt keinen einzigen inset-Schatten an einem Fortschrittsbalken. |
| N-04 / CHECKLISTE: em-Fundstellen | ~740 in 20 Werten | 784 in 30 Werten — gemessen mit exakt dem in der CHECKLISTE abgedruckten grep. Die Checkliste widerspricht der Ausgabe ihres eigenen Kommandos. |
| N-04: verschiedene font-size-Werte | 55 | 55 nur als Roh-Strings ohne variables.css ("0.9em" und "0.9em !important" als zwei Werte); 50 normalisiert, 47 reine Längen-Literale. Mit variables.css 58. |
| N-04: „Im Mobil-Profil wächst die Basis auf 16px" | 14px → 16px | FALSCH. Gemessen: html = 16px und body = 16px in BEIDEN Profilen. Es gibt 0 html-Selektoren in assets/styles/, und core.css:284 body{} setzt keine font-size. --font-size-base: 14px wird nirgends auf die Wurzel angewandt. Der Profilwechsel ändert die Basis heute um 0 %. |
| N-04: „ab 0,7em (ca. 10px) unlesbar" | 0,7em ≈ 10px | 0,7em gegen die reale Basis 16px = 11,2px. Die realen Kleinstwerte entstehen durch Verschachtelung und treten auf dem DESKTOP auf: 169 von 5.032 Elementen unter 11px, kleinster Wert 7,70px (.dms-live-badge). |
| N-05: „7× :focus-visible", Aufzählung nennt 6 | 6 aufgezählte Regeln | Die 7. ist eine NACKTE globale Regel: dmscreen.css:1722 `:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px }` auf Klammertiefe 0, in beiden Bundles. Sie widerlegt die Kernaussage des Befundes. |
| N-05: .nav-tab und .btn-icon „haben keinen Ring" | kein Ring | Beide bekommen den goldenen Ring aus dmscreen.css:1722 (.nav-tab ist <button> ohne outline:none; .btn-icon sitzt in 14 von 15 Fundstellen auf <button>). Die Bearbeiten/Löschen-Knöpfe sind zu 29 von 30 <button>. |
| N-06 / CHECKLISTE: Ausgangswert `transition: all` | 151 (132 + 19) | 163. Es fehlen `all 0.3s` (4), `all 0.2s ease` (4), `all 0.3s ease` (2), `all 0.15s ease` (1), `all 0.3s cubic-bezier(…)` (1). Der Abnahme-grep der CHECKLISTE findet alle 163 — die Abnahme ist strenger als der eigene Ausgangswert. |
| N-06: „sieben Geschwindigkeiten" | 7 (0,1/0,12/0,15/0,2/0,25/0,3/0,5) | 8 — 0.08s fehlt vollständig (party.css:2718, 2754, 2971, Mikro-Druckeffekt) |
| N-06: 0.3s-Vorkommen | 21 | 21 ohne variables.css, 22 mit (variables.css:380, mobile Navigationsleiste) |
| N-07: font-weight 600 / 700 / bold | 277 / 91 / 13 | 285 / 92 / 14 (ohne variables.css und fonts.css). Die Differenz sind 8× `600 !important` (party.css), 1× `700 !important` und 1× `bold !important` (beide spells.css). Über alle Dateien: 288 / 92 / 14. |
| N-07 / CHECKLISTE: Ausgangswerte | 17 Treffer bold|normal|300; 6 verschiedene font-weight-Angaben | 18 Treffer; 7 verschiedene Angaben (300, 400, 500, 600, 700, bold, normal) |
| N-07: „die gebündelten Schriften liegen in 400/500/600/700 vor" | als Maßstab für reale Gewichte | Nur als Vereinigung über vier Familien; keine Familie hat alle vier. Vor allem: die UI benutzt KEINE davon — body trägt var(--font-ui) = 'Segoe UI'. Segoe UI hat keinen 500er-Schnitt (500 rendert dort bereits als 400) und sehr wohl einen 300er (die 300-Begründung ist falsch). |
| N-08: „nur 4 prefers-reduced-motion-Regeln, Bewegung kaum abschaltbar" | 4 gleichrangige Einzelfälle | Einer der vier IST der globale Block: dmscreen.css:1408-1414 `*, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }` auf Top-Level, app-weit wirksam, in beiden Bundles. Alle vier Belegfälle des Berichts (Würfelwurf, HP-Puls, Toast, Kampf-Hervorhebung) sind falsch — der HP-Puls existiert gar nicht, initiative.css enthält 0 Animationen. |
| N-08 / PATCHES §8: !important-Delta und neue Obergrenze | +4, Grenze von 105 auf 109 | +5 (der Block enthält fünf: animation-duration, animation-iteration-count, transition-duration, scroll-behavior und die .dice-result-Ausnahme) → 110. Ausgangswert 105 stimmt und sitzt exakt auf IMPORTANT_MAX = 105. |
| N-08: die Ausnahmeliste des Patches | .dice-crit-glow und .dice-result schützen die Würfelinformation | .dice-crit-glow existiert NIRGENDS im Repo (0 Treffer). .dice-result hat CSS, aber kein Template setzt die ID; der einzige JS-Zugriff steht im als „Fallback to old structure" markierten toten Zweig. Die lebende Anzeige #dice-hero-result trägt gar keine Animation. |
| N-09: „vier Eigenschaften, die als .meta-text schon existieren" | vier gedeckt | .meta-text (core.css:2045) hat ZWEI Eigenschaften: color und font-size: 11px. Es fehlen margin-left: auto (drückt den Zähler an den rechten Rand) und white-space: nowrap; die font-size weicht ab (0,85em ≈ 13,6px gegen 11px). |
| N-09: „die Filterleiste heißt überall sonst .filter-chips" | .filter-chips ist der etablierte Name | Eine nackte Klasse .filter-chips existiert NIRGENDS (0 Treffer in CSS/HTML/JS). Etabliert sind vier präfigierte Container (.npc-/.loc-/.enc-/.loot-filter-chips). .filter-bar (core.css:1965) trägt echtes Layout: display:flex; gap:6px; flex-wrap:wrap. |
| N-09: „zwei Zähl-Anzeigen für dieselbe Liste" | dasselbe | Verschiedene Semantik: #spells-count = Gesamtzahl (String(n)); #spell-count = '📖 12/318', die einzige Live-Filterrückmeldung. setViewCount() schreibt nur String(n) und kann die Bruchform nicht darstellen. |
| Testsuite-Ausgangslage (im Handoff nirgends benannt) | nicht genannt | tests/unit/design-consistency.test.js: 64 passed, 64 total. Ratschen: DUBLETTEN_MAX = 0, IMPORTANT_MAX = 105 (Ist-Wert exakt 105), INLINE_MAX = 257 (Ist-Wert exakt 257), F-03 rem-Treffer = 0. |

---

## Was das Audit nicht gefunden hat

### `color: white` auf gesättigten Akzentflächen — 41 von 51 Stellen unter 4,5:1 im STANDARD-Theme, und der Quellkommentar behauptet das Gegenteil

**Schwere:** hoch · **Ort:** assets/styles/variables.css:283-287 (Token --on-accent) + 51 Regeln in 14 CSS-Dateien

**Beleg:** Eigene Messung: 56 Deklarationen mit `white` als Farbwert, davon 51× color. Verteilung nach Hintergrund derselben Regel: 25× --red, 13× --purple, 2× --blue, 1× --green, 3× Rot-Verläufe, 5× --dmg-*. Kontrast #ffffff auf --red: Dark 3,76 / Contrast 4,00; auf --purple: Dark 2,72 / Sepia 4,38 / Contrast 3,14; auf --blue: Dark 2,54; auf --green: Dark 1,74 / Contrast 1,37. Der Kommentar an variables.css:283-287 sagt wörtlich, die Akzentfarben seien „in allen vier Themes dunkel genug" — die Messung widerlegt das für jedes Theme. Dieselbe Annahme steckt in den 6 Verwendungen von var(--on-accent): welt.css:1073 (.fr-ruf-btn-plus, weiß auf --green) liegt bei 1,74:1 im Standard-Theme und ist damit der schwerste Kontrastfehler im ganzen Baum — schlechter als jede Zahl, die N-02 rot markiert. N-02 präsentiert --on-accent ausgerechnet als das Token, „das genau dieses Problem löst".

**Einzuordnen in:** Welle 4 (N-02) — muss vor §1c entschieden sein, weil §1c anweist, --on-accent auf --red- und --blue-Flächen stehen zu lassen

### Themenunabhängige Textfarben --coin-* und --attr-* fallen in Light/Sepia bis auf 1,29:1

**Schwere:** hoch · **Ort:** assets/styles/variables.css:228-231 und :289-294; 22 color-Verwendungen in party.css:1645-1649, dmscreen.css:2352-2357/2453-2458, dashboard.css:2524-2529

**Beleg:** Die Tokens stehen im Aliasblock, gelten also einmal für alle vier Themes; die tragende Fläche ist var(--bg-dark) (party.css:1241, dmscreen.css:2373). Kontrast gegen --bg-dark: --coin-gm #ffd700 → Dark 13,86 / Light 1,29 / Sepia 1,12 / Contrast 14,97; --coin-sm 10,68 / 1,67 / 1,45 / 11,54; --attr-dex #22c55e 8,53 / 2,09 / 1,81 / 9,22; --attr-con 9,05 / 1,97 / 1,71 / 9,78. Der Kommentar datiert die Münzfarben auf ein Code-Review vom 2026-09-08 und begründet sie mit Unterscheidbarkeit „am gebauten Bündel gemessen" — gemessen wurde offenkundig nur im Dark-Theme. Lehrbuchfall: ein Fix wurde in einem Theme geprüft und als themenunabhängiges Token abgelegt. Die N-02-Tabelle listet ausschließlich Palettenrollen und berührt diese 22 Textfarben nicht; die vorgeschlagene Ratsche §T-1 prüft nur ['gold','green','cyan','yellow','orange','blue','purple'].

**Einzuordnen in:** Welle 4 (N-02)

### --shadow ist im Contrast-Theme weiß — jede Höhenstufe aus §4 würde dort zum Halo

**Schwere:** hoch · **Ort:** assets/styles/variables.css:101

**Beleg:** grep -n -- "--shadow:" assets/styles/variables.css → Z.20 rgba(0,0,0,0.5) · Z.49 rgba(0,0,0,0.15) · Z.75 rgba(0,0,0,0.1) · Z.101 rgba(255,255,255,0.1). N-03 behauptet „in allen vier Themes passend definiert (rgba(0,0,0,0.5) bis rgba(0,0,0,0.1))". Dass es heute niemandem auffällt, liegt allein daran, dass genau EIN Element das Token benutzt (core.css:857, .offline-indicator). §4 skaliert diesen Sonderfall auf 88 Schatten hoch.

**Einzuordnen in:** Welle 5 (N-03) — Blocker B-08

### Rund 11,7 % des CSS ist tot und wird in jeder Audit-Zahl mitgezählt

**Schwere:** hoch · **Ort:** assets/styles/dashboard.css:547-1224 (Block „MAP INTEGRATION", 678 Zeilen) und 606 weitere Regelblöcke

**Beleg:** 438 tote Klassen in 607 vollständig toten Regelblöcken (~3.174 von 27.141 Zeilen), ermittelt per Brace-Parser gegen einen Nutzungskorpus aus Templates + gesamtem JS-Baum, mit Präfixerkennung für dynamisch gebaute Namen (140 Klassen dadurch als lebend erkannt). Verteilung: dashboard 158 Regeln, dmscreen 146, encounters 80, npcs 73, tools 55, core 32, party 29, loot 18. Verifiziert: `grep -rl map-marker` über JS und HTML → 0 Treffer, kein Karten-Modul in loader.js, 116 .map-*-Selektoren allein in dashboard.css. Anteil der vom Audit gezählten Deklarationen in toten Regeln: 52 von 400 rgba (13 %), 126 von 784 em (16 %), 14 von 88 box-shadow (16 %), 13 von 163 transition:all (8 %). Zusätzlich zwei komplett tote @media-Blöcke (dashboard.css:1270, loot.css:116) und die ungenutzte Elevation-Leiter .shadow-sm/-md/-lg (dmscreen.css:1427-1429), die als Dublette zu den geplanten --elev-* stünde.

**Einzuordnen in:** Neue Welle 0 (Vorlauf, vor Welle 4) — Blocker B-13

### DM-Screen-Referenzwidgets: CSS und JS-Markup sind zwei Generationen auseinander, zwei Widgets rendern ungestylt

**Schwere:** hoch · **Ort:** assets/styles/dmscreen.css:2469-2510 und :2832-2875 gegen features/dmscreen/dmscreen-widgets-combat.js:136-147 und -widgets-reference.js:89-118

**Beleg:** CSS erwartet .dms-terrain-sections/-section/-title/-examples/-tag und .dms-skill-group-header/-list/-tag; das JS erzeugt .dms-terrain-list/-item/-type und .dms-skill-header/-item. `grep -rn "dms-terrain-title\|dms-skill-group-header" --include=*.js` → leer. Laufzeitmessung im gebauten Bundle: .dms-terrain-item padding 0px, background transparent, border-radius 0px; .dms-skill-header.str background transparent, font-weight 400. Systematisch 62 tote dms-*-Klassen im CSS und 15 dms-*-Klassen im JS-Markup ohne jede Regel. Für das Audit relevant: die fünf rgba-Regeln in dmscreen.css:2490-2494 sind fünf der 390 gezählten Literale aus N-01 und werden nie getroffen.

**Einzuordnen in:** Welle 0 (eigener Bugfix, nicht Teil des Designsystem-Umbaus)

### Die kompakte Zauberplatz-Anzeige der Charakterkarte hat keine einzige CSS-Regel — unsichtbar und nicht klickbar

**Schwere:** mittel · **Ort:** features/party/party-render.js:330 (erzeugt), assets/styles/ (Regel fehlt vollständig)

**Beleg:** `grep -rn char-slot-pip` über CSS, JS und HTML → genau ein Treffer, die Erzeugung selbst. Auch .char-slot-group/-label/.char-card-slots haben keine Regel. Das erzeugte Markup ist ein <span> OHNE Textinhalt mit data-action="toggle-spell-slot-stop" — ein Inline-Element der Breite 0, also weder sichtbar noch anklickbar noch antippbar. Der Codepfad ist aktiv (party-render.js:159 und :241). Zum Vergleich existiert die Schwesterklasse .slot-pip (dashboard.css:1320) sehr wohl.

**Einzuordnen in:** Welle 0 (eigener Bugfix)

### Die Kritisch-/Patzer-Färbung der Haupt-Würfelansicht ist tot, und die Ergebniszahl schrumpft nach dem ersten Wurf

**Schwere:** mittel · **Ort:** features/dice/dice-core.js:345 und :716-718

**Beleg:** dice-core.js:345 setzt `heroResult.className = ''` auf #dice-hero-result. Damit verliert das Element seine Klasse .dice-hero-result und mit ihr font-size: 5em, color: var(--gold), font-weight: 700 und den Übergang (dice.css:21-27) — die Würfelzahl fällt nach dem ersten Wurf auf Fließtextgröße. Die anschließend gesetzten Klassen crit/fail landen auf dem Container #dice-hero, und `.dice-hero.crit`/`.dice-hero.fail` existiert in KEINER CSS-Datei. Nur das Floating-Panel (.fdp-number) färbt korrekt. Nebenbefund aus derselben Prüfung: .pwa-install-banner (dmscreen.css:1017) steht im Template mit style="display:none" und wird von keiner JS-Zeile referenziert — der all-0.3s-Übergang und die .show-Regel sind toter Code.

**Einzuordnen in:** Welle 0 (eigener Bugfix); entlastet zugleich N-06, weil dice.css:21 keine tragende Stelle ist

### #spells-count ist nach Anlegen/Löschen eines Zaubers stale — dieselbe Lücke bei #quests-count

**Schwere:** mittel · **Ort:** features/spells/spell-manager.js:434 und :530; systems/spellslots/import-export.js:519-541

**Beleg:** saveSpell() und deleteSpell() rufen nur renderSpells() + save(). updateIOCounts() liegt nicht in diesem Pfad, kein Post-Save-Hook ruft es, und TAB_RENDER_REGISTRY.spells rendert ebenfalls nur renderSpells. Der Badge steht bis zum nächsten renderAll (Undo/Redo/Import/Neuladen) falsch. features/quests/quests-render.js hat exakt dieselbe Lücke. Der zuerst genannte N-09-Fix („zweiten Zähler entfernen") löscht damit die korrekte Anzeige und lässt die falsche stehen.

**Einzuordnen in:** Welle 6 (N-09) — Blocker B-12

### Tastatur-Erreichbarkeit: 176 interaktive Elemente ohne tabindex, 58 Chips mit display:none-Eingabe, Mobil-Navigation nicht öffenbar, 35 von 36 Modalen ohne Fokusverwaltung

**Schwere:** hoch · **Ort:** ui/event-delegation.js:37-44 · assets/templates/modals-editors.html:197-514 · assets/templates/view-tools.html:117-126 · assets/styles/variables.css:366-384 · systems/spellslots/navigation.js:78-95

**Beleg:** Verifiziert: tabindex kommt im gesamten JS-Baum 2× vor (beide in migration-wizard.js), in den Templates 0×. EventDelegation.init() registriert nur click/change/input; keiner der 12 keydown-Listener übersetzt Enter/Leertaste auf [data-action]. 176 div/span/li/td mit data-action ohne natives Fokusverhalten (54 in Templates, 122 JS-erzeugt) — darunter die komplette Schnell-Referenz (16 Abschnittsköpfe, 12 Zustände, 7 Würfelknöpfe), alle 10 Schadenstyp-Chips und das Auf-/Zuklappen der Eingabeformulare. 58 Chip-Bedienelemente verstecken ihre Checkbox per `display: none` (38 Resistenz-Chips, 19 Beute-Kategorien, 1 Lair-Schalter) und sind damit aus dem Tabulator-Verlauf entfernt. Im Mobil-Profil ist .mobile-nav-toggle ein reines <div> ohne tabindex, während die ~24 .nav-tab-Buttons per position:fixed + translateY(100%−56px) unter dem Sichtfenster liegen und trotzdem fokussierbar bleiben. 380 <label>, davon genau 1 mit for= → 155 Felder mit unverknüpfter Beschriftung. Trefferflächen: .death-save-dot / .la-dot / .lr-dot je 16×16px bei 4px gap (Mittenabstand 20px, WCAG-2.5.8-Abstandsausnahme greift nicht) — das sind die Elemente, die mitten im Kampf getroffen werden müssen. 35 von 36 Modalen ohne role="dialog"; showModal() setzt nur eine Klasse, kein Fokus ins Modal, keine Rückgabe.

**Einzuordnen in:** Eigener Strang neben Welle 6 — N-05 ist die vorgelagerte Stufe („Ring unsichtbar"), das hier ist „Element gar nicht fokussierbar". Der N-05-Fix ist ohne diesen Strang an den genannten Elementen wirkungslos, und die Tastaturprobe der CHECKLISTE ist ohne ihn nicht abnehmbar.

### Zwei Responsive-Systeme mit verschiedenen Schwellen und ohne resize-Listener

**Schwere:** mittel · **Ort:** ui/layout-profiles.js:17-24 gegen assets/styles/ (54 @media-Blöcke)

**Beleg:** loadLayout() entscheidet EINMALIG beim Laden bei 768px; die Media Queries brechen bei 600/900/1200. Der einzige resize-Listener im Baum (core/init.js:118) betrifft Sticky-Offsets. Reproduziert: Laden bei 1200px, dann auf 500px verkleinert → data-layout bleibt "desktop", während (max-width:600px) und (max-width:900px) beide greifen; .app-header bleibt sticky statt fixed, .mobile-nav-toggle display:none, .nav-tabs display:flex. Sieben Selektoren deklarieren in beiden Systemen widersprechende Werte (.main-content padding, vier Raster-Definitionen, .modal, .bestiary-layout). Zusätzlich tot: [data-layout="mobile"] .nav-tab-icon/.nav-tab-text (variables.css:423-432) — das Markup (header.html:47) hat keine Kind-Spans, das zweizeilige Kachel-Layout greift nie; die 18px und 9px darin sind zwei der in N-04 gezählten Werte.

**Einzuordnen in:** Welle 5 (N-04) — die Argumentation von N-04 über „das Mobil-Profil" setzt ein Profil voraus, das sich zur Laufzeit gar nicht anpasst

### spells.css:338-339 deklariert font-weight zweimal in EINER Regel; Fettschrift ist im Editor 700 und in der Ausgabe 600

**Schwere:** mittel · **Ort:** assets/styles/spells.css:338-339 und die 600!important-Regeln in party.css

**Beleg:** Die Regel [contenteditable="true"] b, … setzt `font-weight: 700 !important;` direkt gefolgt von `font-weight: bold !important;` — die einzige Regel im gesamten CSS mit zwei font-weight-Deklarationen, die zweite gewinnt. Das ist wörtlich das „bold und 700 parallel", das N-07 abstrakt beschreibt, ohne zu bemerken, dass es in zwei aufeinanderfolgenden Zeilen steht; Welle 3 (F-18, „Dubletten zusammengeführt") hat es übersehen. Getrennt davon: der Editor setzt Fett auf 700, die gerenderte Ausgabe (.wiki-detail-body strong, .spell-desc strong, .quest-details strong) auf 600 !important — derselbe <b> sieht beim Tippen anders aus als nach dem Speichern. Beide Blöcke stehen unter dem README-Schutz „die 65 !important in .spell-desc * bleiben".

**Einzuordnen in:** Welle 5 (N-07a) — die Doppelzeile ist zu löschen, nicht zu ersetzen (senkt !important von 105 auf 104)

### PATCHES §2b bricht die heute perfekte Token-Symmetrie der vier Theme-Blöcke, und kein Test sichert sie

**Schwere:** mittel · **Ort:** PATCHES.md §2a/§2b gegen tests/unit/design-consistency.test.js:45

**Beleg:** Gegenprobe am Bestand: die vier Blöcke tragen heute je 21 Properties, FEHLT [] / EXTRA [] für light, sepia und contrast gegen dark — sie driften NICHT auseinander. §2b definiert --red-text ausschließlich im Sepia-Block, §2a listet es nicht im Alias. In Dark, Light und Contrast wäre var(--red-text) unauflösbar; bei der geerbten Eigenschaft color fällt das Element lautlos auf den ererbten Wert zurück. Der bestehende F-01-Test schlägt nicht an, weil er eine EINZIGE defined-Menge über alle Dateien und Blöcke bildet — eine Definition in irgendeinem Block genügt. Die vorgeschlagene Ratsche §T-1 sieht es ebenfalls nicht (Rollenliste ohne 'red' und 'pink').

**Einzuordnen in:** Welle 4 (N-02); die eigentlich fehlende Ratsche ist ein Test, der die Property-MENGEN der vier Blöcke gegeneinander prüft

### `color-scheme` ist nirgends gesetzt — native Bedienelemente ignorieren alle vier Themes

**Schwere:** mittel · **Ort:** assets/styles/variables.css (Fehlstelle); 88 <select>, 205 type="checkbox", 76 type="number" in den Templates

**Beleg:** grep über assets/, core/, ui/, systems/, utils/, features/, render/, build.py und index.html nach `color-scheme` und `prefers-color-scheme` → 0 Treffer. accent-color existiert nur in 13 eng gescopeten Regeln, keine globale input[type=checkbox]-Regel; scrollbar-color genau 1× (dmscreen.css:1954); kein <select> ist per appearance:none nachgebaut. Das Theme hängt am Wurzelelement (core/themes.js:13), erreicht die UA-Oberflächen ohne color-scheme aber nicht — Bildlaufleisten, Ankreuzfelder, Zahlen-Spinner und Datumswähler rendern im Dark- und Contrast-Theme hell.

**Einzuordnen in:** Welle 4 (N-02 / Theme-Vollständigkeit) — eine Zeile pro Theme-Block, die einzige theme-relevante Eigenschaft, die man durch Aufräumen von Literalen NICHT erreicht

### Zwei Stellen, die bei mechanischer Umsetzung Funktion zerstören

**Schwere:** mittel · **Ort:** assets/styles/npcs.css:1617 und assets/styles/core.css:2596 (mit features/locations/locations-render.js:153)

**Beleg:** npcs.css:1617 .npc-trigger-reveal.hidden setzt bewusst background: var(--bg-dark) UND color: var(--bg-dark) — unsichtbarer Spoilertext, der erst auf Klick erscheint. Die Zeile steht in der 100er-Liste von §1c; wer sie mitzieht, deckt NPC-Trigger vorzeitig auf. core.css:2596 .loc-item-tag bekommt seinen Hintergrund erst zur LAUFZEIT aus locations-render.js:153 (style="background: var(--${filter.color})") mit einer von acht Palettenfarben — dafür kann kein statisches --on-*-Token richtig sein, es braucht eine JS-Änderung, die der rein-CSS-Patch nicht vorsieht. Dazu mindestens zwei Kaskadenfälle, in denen der Hintergrund vom Elternselektor kommt (u. a. dashboard.css:3159 .qref-cover-badge.gold strong).

**Einzuordnen in:** Welle 4 (N-02) — als benannte Ausnahmen in §1c aufnehmen, bevor jemand den grep abarbeitet

### Statblock: theme-folgende Überschriftfarbe auf bewusst themenunabhängigem Pergament, in keinem Theme über der Schwelle

**Schwere:** niedrig · **Ort:** assets/styles/bestiary.css:212-216 und :292-298 auf der Fläche aus party.css:394-398

**Beleg:** bestiary-render.js:300 baut <div class="bestiary-statblock read-aloud parchment">; die Fläche kommt aus --ra-parchment-from/-to, laut variables.css:239-251 „BEWUSST themenunabhängig". Darauf stehen zwei Regeln mit color: var(--red). Kontrast gegen #f5e6c8: Dark 3,05 / Light 3,92 / Sepia 3,75 / Contrast 3,24; gegen #e8d4a8: 2,58 / 3,31 / 3,17 / 2,74. Alle acht Werte unter 4,5; die Abschnittsüberschrift ist mit 16px/700 normaler Text. N-02 misst ausschließlich gegen --bg-card und kann das per Konstruktion nicht sehen. Gefahr bei §2c: wer die Regel als „Text auf --bg-card" fehlklassifiziert, verschlimmert es.

**Einzuordnen in:** Welle 4 (N-02)

### Rahmen von Eingabefeldern und Karten erreichen in keinem Theme 3:1 — auch nicht im Theme namens „Hoher Kontrast"

**Schwere:** niedrig · **Ort:** assets/styles/variables.css:19/48/74/100 (--border), 489 Verwendungen

**Beleg:** --border gegen die Feldfläche --bg-dark (WCAG 1.4.11 verlangt 3:1 für Bedienelement-Begrenzungen): Dark 1,71 / Light 1,47 / Sepia 1,53 / Contrast 2,82; gegen --bg-card 1,53 / 1,61 / 1,79 / 2,53. Auffällig ist das Contrast-Theme: es existiert, um Kontrast zu liefern, und liegt bei Formularfeldern mit 2,82 knapp unter der Schwelle — der Nutzer, der es einschaltet, bekommt für Eingabefelder keine Verbesserung. N-02 prüft ausdrücklich nur Text-Rollen; die Nicht-Text-Schwelle kommt im Handoff nicht vor.

**Einzuordnen in:** Welle 6 (zusammen mit N-05: dort der Fokuszustand, hier der Ruhezustand)

---

## Empfohlene Reihenfolge

### Welle 0 — Zahlenkorrektur und Entscheidungsprotokoll (kein Code)

**Inhalt:** Alle 35 Baseline-Korrekturen in BEFUNDE-v2.md, PATCHES.md und CHECKLISTE.md einarbeiten. Die 13 Blocker B-01 bis B-13 schriftlich entscheiden. N-08 als widerlegt schließen und §8 aus PATCHES.md streichen. Die Anker in §1b, §3a, §3b, §5a und §7b durch tatsächlich auflösende ersetzen (u. a.: .btn-primary ist ein mehrzeiliger Block in core.css:2497-2503, nicht der zitierte Einzeiler; die in §3b als core.css zitierte Zeile steht zweimal in loot.css). Für jede Ratsche den Ist-Wert mit demselben Ausdruck messen, den der Test später benutzt.

**Begruendung:** Ohne diesen Schritt beginnt jede Welle mit falschen Ausgangs- und Zielzahlen, und drei der geplanten Ratschen sind von vornherein unpassierbar. Die Abnahme darf nicht strenger sein als die Anweisung (N-06: grep findet 163, Anweisung sagt 151) und nicht blinder (N-02: der zeilenbasierte grep meldet für .btn-primary auch UNGEPATCHT schon „leer").

**Risiko:** Kein Codeitrisiko. Das Risiko liegt im Auslassen: jede hier nicht getroffene Entscheidung kostet später eine komplette Welle Nacharbeit.

### Welle 0b — Löschrunde und drei eigenständige Bugfixes

**Inhalt:** 438 tote Klassen in 607 Regelblöcken löschen (~3.174 Zeilen), beginnend mit dashboard.css:547-1224 („MAP INTEGRATION", 678 Zeilen). Zwei tote @media-Blöcke, die ungenutzte Leiter .shadow-sm/-md/-lg, .nav-tab-icon/.nav-tab-text und den toten .pwa-install-banner mit entfernen. Getrennt davon drei echte Fehler beheben: die DM-Screen-Klassendrift (Gelände- und Fertigkeiten-Widget), .char-slot-pip (Komponente ohne jede CSS-Regel) und dice-core.js:345 (className='' zerstört .dice-hero-result, .dice-hero.crit/.fail existiert nicht).

**Begruendung:** Senkt den Umfang jeder Folgewelle messbar: 13 % der rgba-, 16 % der em- und 16 % der box-shadow-Fundstellen liegen in totem CSS. Es ist die billigste Maßnahme im ganzen Vorhaben, und sie verhindert, dass die Ratschen toten Bestand einfrieren.

**Risiko:** Niedrig-mittel. Textsuche kann dynamisch zusammengesetzte Klassennamen übersehen — vor jeder Löschung Präfixerkennung laufen lassen und die E2E-Suite gegenprüfen. Die drei Bugfixes sind unabhängig und einzeln commitbar.

### Welle 1 (vormals Teil von Welle 4) — N-02, Tinten und Textrollen

**Inhalt:** §1a (2 Tokens × 4 Theme-Blöcke), §1b (drei Punktänderungen an drei Stellen, F-14-Kommentar erhalten), einen vollständigen --on-<rolle>-Satz für alle acht Akzente plus --gold-dim/--gold-hover/--green-dim, §2a/§2b (Platzierung INNERHALB der bestehenden Theme-Blöcke, damit F-01 nicht bricht), dann die 97 Fundstellen aus §1c und die 482 echten color:-Deklarationen aus §2c einzeln. Zusätzlich die neuen Befunde: 51× color:white auf Akzentflächen inkl. der 6 --on-accent-Stellen, --coin-*/--attr-*, color-scheme pro Theme, --red-text in den Alias, Ausnahmen für npcs.css:1617 und core.css:2596.

**Begruendung:** Größter Nutzen und größte Präzision der Diagnose. Muss vor N-01 laufen, weil §3b den Untergrund von 95 „Tint + gleichfarbige Schrift"-Regeln verschiebt und die Zuordnungsregel für die Schriftfarbe dann bereits stehen muss.

**Risiko:** Hoch. ~590 Bearbeitungsstellen, davon rund 90 % Einzelfallurteile; die Trägerfläche ist teils nur über die Kaskade und teils erst zur Laufzeit bestimmbar. Drei bekannte Regressionspfade (:hover-Ableitungen) müssen aktiv verhindert werden. Zwingend: Kontrast NACH der Änderung nachrechnen, nicht nur den Deklarationstext prüfen.

### Welle 2 — N-01, Farbliterale

**Inhalt:** Mechanik entschieden (B-04), dann §3a (35 Weiß-Auflagen: 13 tote var()-Fallbacks löschen, ~15 umstellen, 7 als Ausnahme belassen), §3b erweitert um --cyan/--orange/--purple/--pink/--bg-dark/--bg-card (43 zusätzliche Fundstellen), danach die 141 vorschriftslosen Fundstellen klassifiziert abarbeiten. T-2 mit kommentierter Ausnahmeliste.

**Begruendung:** Nach N-02, weil dort die Schriftfarben der 95 Chip-Regeln bereits gesetzt sind. Vor N-03, weil die 1px-Haarlinien rgba(255,255,255,0.05) in .modal und .floating-dice-panel in derselben Deklaration wie ein N-03-Schatten stehen und koordiniert angefasst werden müssen.

**Risiko:** Mittel-hoch. Zwei Drittel mechanisch, ein Drittel Urteil. Wichtigste Falle: „dieselbe Optik" gilt nur für die 198 exakten Dark-Treffer; für 25 Fundstellen aus fremden Theme-Paletten und 66 palettenfremde Werte ändert die Umstellung das Bild auch im Dark-Theme sichtbar (tools.css:1517 #ffd700 → #d4af37 ist ein deutlicher Sprung).

### Welle 3 — N-03, Höhenstufen

**Inhalt:** Nach B-08: gestaffelte Deckkraft pro Stufe, eigener Contrast-Schattenwert, getrennte Tokens für Ring und Glühen, farbige Glühe und farbige Elevation ergänzt, 6px-Zeile und seitlicher Schatten in der Tabelle. Dann die 58 mechanischen Stellen in einem Zug, die 22 Urteilsfälle einzeln. @keyframes floatingPulse ausdrücklich ausnehmen. T-3-Schwelle gemessen statt geraten.

**Begruendung:** Klein genug, um es nach den zwei großen Farbwellen sauber abzuschließen, und es erbt die Ausnahmeliste aus Welle 2.

**Risiko:** Mittel. Die 22 Urteilsfälle sind überproportional sichtbar (Kartenmarker, Würfelknopf, Aktivzustände, Statblock-Schublade), während die 58 mechanischen fast alle unsichtbare Dropdown- und Tooltip-Schatten sind.

### Welle 4 — N-06, Übergänge, in drei Teilschritten

**Inhalt:** Erst Tokens plus die 155 rein mechanischen `all`-Stellen ohne Sonderfälle. Dann die ~13 tragenden Stellen einzeln mit der erweiterten Eigenschaftsliste (opacity, visibility, filter, text-shadow). Zuletzt die 124 Dauer-Tokenisierungen. Nach dem ersten Schritt Sichtprüfung von Würfelansicht, Floating-Panel und Löschknöpfen in Listen.

**Begruendung:** Der Dreischnitt trennt das stumpfe Suchen-Ersetzen von den elf stillen Regressionen. Nach dem ersten Schritt ist die App in einem prüfbaren Zustand.

**Risiko:** Mittel. Kein Test im Repo prüft Übergänge — der einzige Schutz ist die Sichtprüfung. Zusätzlich ändert `--ease` das Bewegungsgefühl von 263 heute impliziten `ease`-Übergängen; das braucht eine eigene Freigabe.

### Welle 5 — N-04, Typografie (atomar) und N-07a

**Inhalt:** N-04: §5a und §5b in EINEM Commit, nach der in B-01 getroffenen Entscheidung (Wurzel bei 16px, --text-*-Werte gegen 16 gerechnet). Zuordnung für die 12 Werte ohne Tabellenzeile, für die 8 var(--font-size-*)-Reads (inkl. der iOS-Auto-Zoom-Sperre) und für die 53 gemessenen Verschachtelungsketten. variables.css in die Prüfung aufnehmen (dort stehen die 9px der Mobil-Navigation). Parallel N-07a: 14× bold→700, 3× normal→400, die tote Doppelzeile spells.css:339 löschen — 21 garantiert folgenlose Stellen.

**Begruendung:** Die größte einzelne Welle und die mit der größten optischen Wirkung; sie gehört hinter die Farb- und Bewegungsarbeit, damit eine optische Regression eindeutig zuzuordnen ist. N-07a läuft nebenher, weil es risikofrei ist.

**Risiko:** Hoch für N-04 (1.078 Stellen, atomar, kein dateiweiser Rollout möglich, kein Test misst den Endwert — nur eine headless gemessene Sichtprüfung fängt einen Fehler). Sehr niedrig für N-07a (bold===700 und normal===400 sind per Spezifikation identisch).

### Welle 6 — N-05 neu geschnitten und N-09

**Inhalt:** N-05: die vorhandene globale Regel aus dmscreen.css:1722 nach core.css verschieben und dokumentieren; entscheiden, ob der goldene Rahmen als Ringersatz gilt; bei nein die 33 :focus-Selektoren auf :focus-visible umschreiben; party.css:1485 per box-shadow oder :focus-within reparieren; border-radius aus der globalen Regel streichen. N-09: renderSpells() um setViewCount('spells', totalCount) ergänzen (behebt den Altfehler, auch bei quests), den Filterzähler behalten und nur den Inline-Stil durch eine eigene Klasse ersetzen, .filter-bar samt CSS-Regel umbenennen, F-10-Ratsche nachschärfen. Zusätzlich der Ruhezustands-Befund zu --border.

**Begruendung:** Kleinste Wellen zuletzt; beide sind vom Rest unabhängig. N-09 ist erst nach der Semantik-Entscheidung ausführbar.

**Risiko:** Niedrig, sofern der Patch neu geschrieben ist. Hoch, wenn er wörtlich ausgeführt wird: dann ist N-05 Nullarbeit mit einem unbeabsichtigten Formsprung, und N-09 bricht das Layout der drei Zauber-Filterleisten.

### Eigener Strang (parallel, JS-seitig) — Tastatur-Erreichbarkeit

**Inhalt:** tabindex/role/Enter-Leertaste für 176 interaktive div/span; die 58 display:none-Chip-Eingaben auf .sr-only umstellen; .mobile-nav-toggle bedienbar machen und die Mobil-Reiter außerhalb des Sichtfensters aus dem Tabulator-Verlauf nehmen; 155 <label for>; Fokusverwaltung und role="dialog" für 35 Modale; Trefferflächen der Kampf-Pips.

**Begruendung:** N-05 ist wirkungslos an Elementen, die gar keinen Fokus annehmen können. Die Tastaturprobe der CHECKLISTE („Tab durch Orte-Ansicht — Filter-Chips und Listenzeilen zeigen einen Ring") ist ohne diesen Strang nicht abnehmbar und muss bis dahin aus der Checkliste heraus.

**Risiko:** Mittel. Kein CSS, sondern Markup und Event-Handling; berührt die Ereignisdelegation zentral. Sollte NICHT in einer Designwelle mitlaufen, sondern eigene Commits und eigene Abnahme bekommen.

---

## Aufwand

Gesamtumfang, ehrlich gerechnet: rund 2.400 bis 2.800 echte Bearbeitungsstellen — nach der Löschrunde in Welle 0b etwa 10 bis 15 % weniger. Der Handoff beziffert das nirgends und untertreibt an zwei Stellen dramatisch (N-02: „fünf weitere Stellen\" statt 97; N-01: „danach bleibt kein Tripel übrig\" bei 141 vorschriftslosen Fundstellen).

Aufteilung nach Befund (Bearbeitungsstellen / Anteil mechanisch):
· N-04 Typografie — 1.078 Stellen, ~85 % mechanisch, aber ATOMAR und mit zwei Struktureingriffen, an denen die gesamte optische Wirkung hängt. Größte Einzelwelle, größtes Risiko einer stillen Globaländerung (3.431 von 5.032 Elementen ändern sich allein durch die Wurzelregel).
· N-02 Tinten/Textrollen — ~590 Stellen, nur ~10 % mechanisch. Die 7 Token-Einfügepunkte sind Minuten, die 97 + 482 Fundstellen sind Einzelfallurteile, deren Trägerfläche teils nur über die Kaskade und teils erst zur Laufzeit bestimmbar ist. Aufwandsseitig die teuerste Welle pro Stelle.
· N-07 Gewichte — 368 Stellen, aber der Schnitt entscheidet alles: 21 Stellen (bold/normal/Doppelzeile) sind garantiert folgenlos und in einer halben Stunde erledigt; 54 Stellen (500) sind nach EINER Entscheidung mechanisch; die 285 600er-Durchsichten sind unbegrenzte Handarbeit ohne Abnahmekriterium. Empfehlung: N-07 aufteilen und nur den ersten Teil als Arbeitspaket führen.
· N-06 Übergänge — 287 Stellen, ~54 % stumpfes Suchen-Ersetzen, ~41 % schematisch, ~5 % echte Urteilsarbeit. In drei Teilschritten gut beherrschbar.
· N-01 Farbliterale — 372 Zeilen mit 390 Vorkommen, rund zwei Drittel mechanisch. Der Rest (66 palettenfremde Werte, 25 aus fremden Theme-Paletten, 7 Weiß-auf-Farbe-Fälle) ist Urteil.
· N-03 Höhenstufen — 83 Stellen, 58 mechanisch, 22 Urteil. Die 22 sind überproportional sichtbar.
· N-05 — wie geschrieben 6 Stellen und wirkungslos; richtig geschnitten 5 bis 40 Stellen, je nach Rahmen-Entscheidung, plus ein eigener JS-Strang von mehreren hundert Fundstellen.
· N-09 — 8 Stellen, davon 4 reines Suchen-Ersetzen. Priorisierung „Niedrig\" ist angemessen.
· N-08 — 0 Stellen. Der Befund ist widerlegt.
· Welle 0b Löschrunde — ~607 Regelblöcke, mechanisch, aber mit Sorgfaltspflicht bei dynamischen Klassennamen.

Splittbarkeit: gut bei N-01, N-03, N-06, N-07a und N-09 — dort sind dateiweise Zwischencommits möglich und für ein späteres `git bisect` auch nötig. Schlecht bei N-02 (die Tinten-Tokens und die 97 Fundstellen hängen zusammen; ein Teilstand hat Knöpfe mit falschem Kontrast) und unmöglich bei N-04, wo Wurzelregel und Ersetzungen in einem Commit landen müssen, weil die App sonst in jeder noch nicht umgestellten Datei 12,5 % zu klein ist.

Urteilsanteil insgesamt: etwa ein Drittel der Stellen verlangt eine Einzelentscheidung, die im Handoff nicht getroffen ist. Das ist der eigentliche Aufwandstreiber — nicht die Zahl der Zeilen. Rechnen Sie damit, dass die Vorbereitung (Welle 0: Zahlenkorrektur, 13 Blocker-Entscheidungen, Anker-Reparatur, Ratschen-Vorbereitung) ein eigenes, nicht triviales Arbeitspaket ist; ohne sie erzeugt jede Welle Nacharbeit an Stellen, die bereits angefasst wurden.

Testabdeckung als Aufwandsfaktor: das Netz aus 64 Tests prüft ausschließlich Deklarationstext, nie den berechneten Endwert. Genau deshalb konnte --on-accent 17 von 24 Theme-Zellen verfehlen, ohne dass etwas rot wurde. Für N-02 und N-04 braucht es eine headless gemessene Abnahme (Playwright gegen das gebaute Bündel), sonst ist die Welle nur scheinbar abgesichert — das ist zusätzlicher, im Handoff nicht eingeplanter Aufwand, aber ohne ihn sind die beiden teuersten Wellen nicht verifizierbar.
