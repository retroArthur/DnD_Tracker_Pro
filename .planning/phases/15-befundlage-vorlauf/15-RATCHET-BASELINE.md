# Phase 15 Plan 08 — Ratchet-Baseline-Messprotokoll

**Datum:** 2026-09-09
**Node-Version:** v24.14.0 (`node --version`, zum Messzeitpunkt dieser Sitzung)
**Voraussetzung:** Der Löschlauf aus Plan 15-07 (20 Commits, `fb54b3e`..`61266b1`) ist zum
Messzeitpunkt vollständig committet — HEAD dieser Sitzung ist `79db6fc` (die letzte 15-07-
Metadaten-Commit-Kette). Alle Zahlen unten sind der Stand **nach** dem Löschlauf, keine einzige
davon ist ein Vor-Löschlauf-Stand. Eine wörtliche Einschränkung dieser Voraussetzungszeile steht
unter Messblock 6 unten — sie betrifft nur die `--check`-Restfrage, nicht die Vollständigkeit des
Löschlaufs selbst.

> Diese Datei ist die eingecheckte Grundlage, auf die die Ratschen der Phasen 16 (Farbe), 17
> (Schatten & Bewegung), 18 (Typografie) und 19 gepinnt werden. Jede Zahl unten wurde in dieser
> Sitzung frisch gegen den lebenden Baum erhoben — keine Zahl aus `15-CONTEXT.md`, `15-RESEARCH.md`
> oder einem früheren Plan-Handoff wurde übernommen. Insbesondere die drei kursierenden
> Löschzahlen aus dem externen Design-Handoff — **438 tote Klassen / 607 Regelblöcke / ~3.174
> Zeilen** — sind hier NICHT als Zielwert oder Ist-Wert übernommen. Sie waren bereits in Plan 15-06
> als nicht reproduzierbar verworfen (nur die Gesamtzeilenzahl 27.141 hatte sich bestätigt); die
> tatsächlich verbindlichen Zahlen aus 15-06 (738 tote Klassen / 757 tote Regelblöcke / 5.762
> Zeilen, vor der Löschung) und aus 15-07 (0 tote Regelblöcke, 5.148 Netto-Zeilen gelöscht, nach der
> Löschung) stehen unten in Messblock 5 und sind die einzigen maßgeblichen.

## Messblock 1 — Vier Basisgrößen (DEAD-03), nach dem Löschlauf

**Befehl:** `node tools/css-usage-report.js` (ohne Flags, Standardausgabe gegen `assets/styles/*.css`)
**Zählart:** Vorkommen (nicht Zeilen, nicht Deklarationsblöcke) — jedes einzelne Zahlentripel,
jede `em`-Einheit, jede `box-shadow`-Deklaration, jedes `transition: all` zählt als ein Treffer.

| Basisgröße | Gesamt (nach dem Löschlauf) | Davon in toten Regeln |
|---|---|---|
| `rgba`/`rgb`-Zahlentripel | **336** | **0** |
| `em` (relative Schriftgrößen) | **641** | **0** |
| `box-shadow`-Deklarationen | **71** | **0** |
| `transition: all` | **132** | **0** |

**Vergleich zum Vor-Löschlauf-Stand aus Plan 15-06** (dort zusätzlich mit Anteil in toten Regeln,
VOR jeder Löschung erhoben):

| Basisgröße | Vorher (15-06) | Davon vorher in toten Regeln | Jetzt (nach 15-07) | Davon jetzt in toten Regeln |
|---|---|---|---|---|
| `rgba`/`rgb`-Zahlentripel | 389 | 49 | **336** | **0** |
| `em` | 817 | 173 | **641** | **0** |
| `box-shadow` | 88 | 13 | **71** | **0** |
| `transition: all` | 163 | 30 | **132** | **0** |

**Interpretation:** Alle vier Werte sind gesunken (die Differenz entspricht exakt den in Plan 15-07
gelöschten toten Regeln), und für keine der vier Größen bleibt nach der Löschung noch ein
Vorkommen in einer toten Regel übrig — jeder verbliebene Wert ist in lebendem CSS. Kein Wert ist
0 gewesen und wurde ausgelassen; alle vier "davon in toten Regeln"-Spalten sind ausdrücklich mit
**0** eingetragen (DEAD-03/empty), nicht weggelassen. `REQUIREMENTS.md`s DEAD-03-Bullet nennt noch
die Vor-Löschlauf-Anteile (52/400, 126/784, 14/88, 13/163 — geringfügig andere Nenner als hier, weil
dort vor Plan 15-04/15-05s CSS-Änderungen gemessen wurde); diese Datei hier ersetzt jene Zahlen als
die für Phase 16-19 maßgebliche, aktuellste Baseline.

## Messblock 2 — Die drei bestehenden Ratschen, Ist-Werte nach dem Löschlauf

**Befehl:** `npx jest tests/unit/design-consistency.test.js` (Testausdrücke `F-18`/`F-19` selbst,
zusätzlich mit einem eigenen Node-Einzeiler nachgemessen, der exakt dieselbe `bloecke()`-Funktion
und denselben `!important`-Zählausdruck aus dem Testfile wortgleich reproduziert, um den
tatsächlichen Zahlenwert zu erhalten, nicht nur PASS/FAIL).
**Zählart:** `DUBLETTEN_MAX` zählt zusammengeführte Selektor-Kontext-Gruppen mit mehr als einem
Vorkommen (Regelblöcke, nicht Zeilen); `IMPORTANT_MAX` zählt `!important`-Vorkommen im
kommentarfreien CSS (Vorkommen, nicht Zeilen); `INLINE_MAX` zählt `style="`-Vorkommen in
`assets/templates/*.html` (Vorkommen, nicht Zeilen).

| Ratsche | Konstante (vor diesem Plan) | Ist-Wert (nach dem Löschlauf) | Nachgezogen? |
|---|---|---|---|
| `DUBLETTEN_MAX` (F-18) | 0 | **0** | Nein — unverändert, weiterhin exakt auf der Grenze, kein Spielraum |
| `IMPORTANT_MAX` (F-18) | 105 | **105** | Nein — unverändert, weiterhin exakt auf der Grenze; keine der 5.148 gelöschten Zeilen enthielt eine der 105 begründeten `!important`-Deklarationen |
| `INLINE_MAX` (F-19) | 256 | **256** | Bereits in Plan 15-07 nachgezogen (257→256, D-49-Doppelbeweis dort erbracht) — in dieser Sitzung nur bestätigt, nicht erneut gesenkt |

**Interpretation:** Von den drei bestehenden Ratschen konnte (und musste) nur eine sinken —
`INLINE_MAX`, bereits in Plan 15-07 mit vollständigem Rot-Grün-Beweis erledigt (siehe Nachtrag 5
unten). `DUBLETTEN_MAX` und `IMPORTANT_MAX` stehen unverändert exakt auf ihrer alten Grenze; keine
der 5.148 in Plan 15-07 gelöschten CSS-Zeilen enthielt eine Dublette oder ein `!important`. Da sich
keine der beiden Konstanten in dieser Sitzung ändert, ist für sie kein neuer Rot-Grün-Doppelbeweis
fällig (die Beweispflicht (D-49) gilt für *Änderungen*, nicht für eine bestätigte Konstante) —
bestätigt durch den grünen Jest-Lauf in Messblock 7.

## Messblock 3 — F-20 Bewegungsunterdrückungs-Ratsche, Ist-Wert nach dem Löschlauf

**Befehl:** `npx jest tests/unit/design-consistency.test.js -t "F-20"`, nachgemessen mit dem
identischen `cssFiles.filter(f => withoutComments(f.content).includes('prefers-reduced-motion'))`-
Ausdruck aus dem Testfile.
**Zählart:** Zahl der Dateien unter `assets/styles/`, deren kommentarfreier Inhalt die At-Rule
`prefers-reduced-motion` mindestens einmal enthält (Dateien, nicht Vorkommen).

| Ratsche | Konstante | Ist-Wert (nach dem Löschlauf) | Nachgezogen? |
|---|---|---|---|
| `REDUCED_MOTION_BLOCKS_MAX` (F-20) | 1 | **1** (`core.css`) | Nein — unverändert seit Plan 15-01; der Löschlauf hat `core.css`s globalen Block nicht angefasst |

**Interpretation:** Der komplette Rot-Grün-Beweis dieser Ratsche wurde bereits in Plan 15-01
erbracht (sechs protokollierte Läufe, siehe Nachtrag 1 unten) — diese Sitzung bestätigt nur, dass
der Löschlauf aus Plan 15-07 den einzigen verbliebenen Block in `core.css` nicht berührt hat.

## Messblock 4 — F-21 Regelfreie DM-Screen-Widget-Klassen, Ist-Wert nach dem Löschlauf

**Befehl:** `npx jest tests/unit/design-consistency.test.js -t "F-21"`, nachgemessen mit einem
eigenen Node-Skript, das `classAttrTokens()`/`hasSelector()`/`unstyledDmsClasses()` aus dem
Testfile wortgleich (String-Konkatenation statt Template-Literal, um Escaping-Fehler beim
Nachbau auszuschließen, aber regex-äquivalent) reproduziert.
**Zählart:** Klassennamen mit dem Präfix `dms-`, die in einem `class`-Attribut des Quellbaums
(`features/`, `systems/`, `ui/`, `core/`, `render/`, `utils/`, `assets/templates/`) vorkommen und
für die es im kommentarfreien CSS keinen Selektor gibt (eindeutige Klassennamen, nicht Vorkommen).
Der Filter auf `class=`-Attribute ist zwingend — ohne ihn lieferte dieselbe Suche (nachgemessen)
133 statt 7 eindeutige `dms-`-Tokens im Quellbaum, weil `data-action`-Werte, IDs und JS-interne
Bezeichner mit demselben Präfix sonst mitgezählt würden.

| Ratsche | Konstante | Ist-Wert (nach dem Löschlauf) | Nachgezogen? |
|---|---|---|---|
| `DMS_UNSTYLED_MAX` (F-21) | 7 | **7** (namentlich: `dms-dc-mini`, `dms-econ-icon`, `dms-econ-val`, `dms-economy-header`, `dms-ritual-item`, `dms-ritual-list`, `dms-save-desc`) | Nein — unverändert seit Plan 15-04; der Löschlauf hat keine dieser sieben JS-Klassennamen betroffen, weil in Plan 15-07 ausschließlich bereits als TOT erkanntes CSS gelöscht wurde, nie eine JS-Renderdatei |

**Interpretation:** Der Restbestand ist Zeichen für Zeichen identisch mit der in Plan 15-04
gemessenen Liste. Kein Löschcommit aus 15-07 hat eine CSS-Regel entfernt, die für eine dieser
sieben `dms-`-Klassen jemals existiert hätte (sie waren von Anfang an regelfrei, nicht durch die
Löschung regelfrei geworden) — die Ratsche bleibt unverändert bei 7.

## Messblock 5 — css-usage-report Gesamtzahlen, Endstand nach dem Löschlauf

**Befehl:** `node tools/css-usage-report.js` (ohne Flags)
**Zählart:** je Datei drei Spalten — tote Klassennamen (Vorkommen je Datei, eine global mehrfach
tote Klasse zählt in jeder Datei einzeln), tote Regelblöcke (vollständige `{...}`-Blöcke, bei denen
JEDE Klasse im Selektor tot ist), Zeilen darin.

| Datei | tote Klassen | tote Regelblöcke | Zeilen darin |
|---|---|---|---|
| bestiary.css | 3 | 0 | 0 |
| command-palette.css | 0 | 0 | 0 |
| core.css | 33 | 0 | 0 |
| dashboard.css | 35 | 0 | 0 |
| dice.css | 2 | 0 | 0 |
| dmscreen.css | 48 | 0 | 0 |
| editors.css | 8 | 0 | 0 |
| encounters.css | 17 | 0 | 0 |
| file-backup.css | 0 | 0 | 0 |
| fonts.css | 0 | 0 | 0 |
| initiative.css | 10 | 0 | 0 |
| loot.css | 21 | 0 | 0 |
| migration.css | 0 | 0 | 0 |
| npcs.css | 18 | 0 | 0 |
| party.css | 25 | 0 | 0 |
| pwa.css | 1 | 0 | 0 |
| spells.css | 7 | 0 | 0 |
| tools.css | 15 | 0 | 0 |
| variables.css | 3 | 0 | 0 |
| welt.css | 0 | 0 | 0 |
| **Summe (je Datei)** | **246** | **0** | **0** |
| **Global eindeutig** | **209** (204 außerhalb der Ausnahmeliste) | **0** | **0** |

**Vorher/Nachher-Gegenüberstellung (Plan 15-06 vor der Löschung → diese Sitzung nach der
Löschung), keine Behauptung, nur Zahlen:**

| Kennzahl | Vorher (15-06) | Nachher (diese Sitzung) |
|---|---|---|
| Tote Klassen, global eindeutig | 738 (733 außerhalb Ausnahmeliste) | **209** (204 außerhalb Ausnahmeliste) |
| Tote Regelblöcke | 757 | **0** |
| Zeilen in toten Regeln | 5.762 | **0** |

**Interpretation:** DEAD-01s wörtliche Anforderung ("die vom Werkzeug gemessene Menge toter
Klassen in vollständig toten Regelblöcken ist gelöscht") ist erfüllt: **0 tote Regelblöcke** bleiben
irgendwo im Baum. Die verbliebenen 209 (204 relevante) toten Klassennamen sind ausschließlich
Überlebende in Verbund-/Komma-Selektoren, in denen mindestens eine Geschwisterklasse noch lebendig
ist (Anker-Regel des Werkzeugs, T-15-18-Mitigation) — siehe Messblock 6.

## Messblock 6 — `--check`-Restbefund, unverändert seit Plan 15-07 (offener, dokumentierter Fund)

**Befehl:** `node tools/css-usage-report.js --check`
**Zählart:** eindeutige tote Klassennamen außerhalb der 5 datierten `DEAD_EXCEPTIONS`-Einträge.

```
node tools/css-usage-report.js --check
Exit-Code: 1
Insgesamt 209 tote Klassen (davon 204 ausserhalb der Ausnahmeliste).
```

Repräsentative Beispiele aus der 204-Klassen-Liste (vollständige Liste im Werkzeug-Output
reproduzierbar): `pwa-banner` (überlebt nur via `.pwa-banner.visible` — `visible` ist eine
lebendige, fachfremde Utility-Klasse), `dice-btn` (überlebt nur via `.dice-btn.d4`/`.dice-btn.coin`
— `d4`/`coin` sind über `.dice-die.d4`/`.fdp-die.d4` in einem völlig anderen Feature lebendig),
`card-surface`/`fr-card` (gemeinsame Komma-Liste `.card-surface, .wp-card, .tl-event-card,
.fr-card`), sowie `encounter-card`, `npc-card-body`, `location-card` und ähnliche.

**Diese Zahl ist mit der in Plan 15-07 dokumentierten Zahl identisch (204)** — zwischen dem letzten
Löschcommit (`61266b1`) und dieser Messung wurde keine CSS-Datei verändert, daher ist Stabilität
über die beiden Messzeitpunkte hinweg selbst ein Reproduzierbarkeits-Beleg (DEAD-03/ordering): derselbe
Befehl auf demselben Stand liefert dieselbe Zahl.

**Warum dieser Befund NICHT in diesem Plan geschlossen wird:** Zwei Wege wurden in Plan 15-07
geprüft und verworfen — (a) die anker-geschützten Verbundselektoren trotzdem löschen (riskant,
würde echtes lebendes CSS treffen, sobald auch nur eine der koexistierenden Klassen live ist) und
(b) ~204 ungeprüfte `DEAD_EXCEPTIONS`-Einträge im Schnelldurchgang anlegen (würde die
handgeprüfte, individuell begründete Registrierung aus Plan 15-06 — 5 Einträge, jeder mit eigenem
Grep-Beleg — entwerten). Diese Baseline übernimmt diese Entscheidung unverändert: `--check` bleibt
mit Exit-Code **1** dokumentiert, nicht künstlich auf 0 gebracht. Der Fund ist zusätzlich in
`.planning/WINDOWS.md` als offener Eintrag (`kind: unmet-truth`, Phase 15) geführt und wartet auf
eine menschliche Entscheidung vor Phase 16.

## Messblock 7 — Suiten-Endstände, Abschlusslauf dieser Sitzung

**Befehl je Zeile:** siehe Spalte "Befehl". **Zählart:** bestandene/fehlgeschlagene Testfälle bzw.
Exit-Code, wie vom jeweiligen Runner selbst berichtet (kein grep-Äquivalent).

| Suite | Befehl | Ergebnis | Neue Tests namentlich |
|---|---|---|---|
| Jest (gesamt) | `npx jest` | **1243/1243 bestanden** (54 Suiten, 50 Snapshots) | — (keine neuen Unit-Tests in diesem Plan) |
| `design-consistency.test.js` | `npx jest tests/unit/design-consistency.test.js` | **67/67 bestanden** | F-20 (2 Fälle, Plan 15-01), F-21 (1 Fall, Plan 15-04) — beide bereits vor diesem Plan committet, hier nur bestätigt |
| Playwright (gesamt) | `npx playwright test --reporter=list` | **364 bestanden / 2 skipped**, 0 fehlgeschlagen | `computed-style-diff.spec.js` (3 Fälle, Plan 15-06), `design-fixes.spec.js` (9 Fälle: 3× FIX-01 Plan 15-04, 6× FIX-02/FIX-03 Plan 15-05) |
| pytest (Build-Tests) | `PYTHONIOENCODING=utf-8 python -m pytest tests/build -q` | **24/24 bestanden** | — |
| Build (Development) | `PYTHONIOENCODING=utf-8 python build.py` | **Exit 0**, kein `[FEHLER]`/`[ABORTED]` | — |
| Build (Production) | `PYTHONIOENCODING=utf-8 python build.py --production` | **Exit 0**, kein `[FEHLER]`/`[ABORTED]` | — |
| `node tools/css-usage-report.js --check` | siehe Messblock 6 | **Exit 1** (dokumentierter, offener Fund) | — |

**Interpretation:** Alle automatisierten Gates dieser Phase sind grün außer dem in Messblock 6
dokumentierten, bewusst offen gelassenen `--check`-Restbefund. Der Computed-Style-Diff
(`computed-style-diff.spec.js`, Teil der 364 bestandenen Playwright-Fälle) meldet null unerwartete
Abweichungen — die dritte Nachweissäule aus Plan 15-06 bestätigt den Löschlauf zusätzlich zur
grünen Unit-/E2E-Suite.

## Ratschen-Nachträge (D-49) — je Ratsche Rot- und Grün-Exit-Code

### Nachtrag 1 (zu Messblock 3) — F-20 Bewegungsunterdrückungs-Ratsche, Rückbausicherung

**Quelle:** Plan 15-01, Task 1. Übernommen unverändert aus `15-01-SUMMARY.md` § „Ratschen-Beweis
(D-49)".

| # | Schritt | Grenzwert | Ergebnis | Exit-Code |
|---|---|---|---|---|
| 1 | Ratsche geschrieben, VOR dem CSS-Merge | 1 | ROT — 2 von 2 Tests fehlgeschlagen (erwartet ≤1, erhalten 4) | **1** |
| 2 | Nach dem CSS-Merge (vier Entfernungen + eine Neuanlage) | 1 | GRÜN — 66/66 | **0** |
| 3 | Schwellwert-Sweep: Grenzwert auf 0 gesetzt | 0 | ROT — erwartet ≤0, erhalten 1 | **1** |
| 4 | Schwellwert-Sweep: Grenzwert zurück auf 1 | 1 | GRÜN — 2/2 | **0** |
| 5 | Verstoß-Sweep: echten Verstoß eingefügt (zweiter Block in `loot.css`) | 1 | ROT — erhalten 2 Dateien statt 1 | **1** |
| 6 | Verstoß-Sweep: Verstoß zurückgenommen | 1 | GRÜN — 2/2 | **0** |

Sechs protokollierte Exit-Codes, drei davon ungleich 0 — Kriterium erfüllt.

### Nachtrag 2 (zu Messblock 4) — F-21 Regelfreie DM-Screen-Widget-Klassen

**Quelle:** Plan 15-04, Task 3. Übernommen unverändert aus `15-04-SUMMARY.md` § „Ratschen-Beweis
(D-49)".

| # | Schritt | Grenzwert | Ergebnis | Exit-Code |
|---|---|---|---|---|
| 1 | Ist-Wert gemessen und als Grenzwert gesetzt | 7 | GRÜN — 1/1 | **0** |
| 2 | Schwellwert-Sweep: Grenzwert auf 6 gesenkt | 6 | ROT — erwartet ≤6, erhalten 7 | **1** |
| 3 | Schwellwert-Sweep: Grenzwert zurück auf 7 | 7 | GRÜN — 1/1 | **0** |
| 4 | Verstoß-Sweep: echten Verstoß eingefügt (`dms-temp-unstyled-probe`) | 7 | ROT — erwartet ≤7, erhalten 8 | **1** |
| 5 | Verstoß-Sweep: Verstoß zurückgenommen | 7 | GRÜN — 1/1 | **0** |

Fünf protokollierte Exit-Codes, zwei davon ungleich 0 — Kriterium erfüllt.

### Nachtrag 3 — Roter Vorlauf FIX-01 (DM-Screen-Referenzwidgets)

**Quelle:** Plan 15-04, Tasks 1-3. Übernommen unverändert aus `15-04-SUMMARY.md` §
„Ratschen-Beweis (D-49)".

| # | Schritt | Ergebnis | Exit-Code |
|---|---|---|---|
| 1 | Roter Vorlauf des neuen Specs, VOR jeder CSS-Änderung | ROT — 3 von 3 Fällen fehlgeschlagen (Geländeeintrag `padding-top: 0px`; Fertigkeiten-Kopfzeile `background-color: rgba(0,0,0,0)`; Wissensgebiete-Spans identisch formatiert) | **1** |
| 2 | Nach dem CSS-Umbau Gelände + Fertigkeiten (Task 2), Wissensgebiete noch offen | 2 bestanden, 1 fehlgeschlagen (Wissensgebiete — erwartet, Task 3 folgt) | **1** |
| 3 | Nach dem Wissensgebiete-Fix (Task 3), alle drei Fälle | GRÜN — 3/3 | **0** |

Drei protokollierte Exit-Codes, zwei davon ungleich 0 — Kriterium erfüllt.

### Nachtrag 4 — Roter Vorlauf FIX-02/FIX-03 (Zauberplatz-Pips, Würfelfarbe)

**Quelle:** Plan 15-05, Tasks 1-2. Übernommen unverändert aus `15-05-SUMMARY.md` §
„Ratschen-Beweis (D-49)".

| # | Schritt | Ergebnis | Exit-Code |
|---|---|---|---|
| 1 | Roter Vorlauf, VOR jeder Code-Änderung (6 neue Fälle gleichzeitig angelegt) | 6 fehlgeschlagen (3× FIX-02, 3× FIX-03), 3 bestanden (FIX-01 unverändert) | **1** |
| 2 | Nach der Zauberplatz-Reparatur (Task 1) — FIX-03 erwartungsgemäß weiterhin rot | 6 bestanden (FIX-01+FIX-02), 3 fehlgeschlagen (FIX-03) | **1** |
| 3 | Nach der Würfel-Reparatur (Task 2), alle neun Fälle | GRÜN — 9/9 | **0** |

Drei protokollierte Exit-Codes, zwei davon ungleich 0 — Kriterium erfüllt.

### Nachtrag 5 — Absenkung der Inline-Stil-Ratsche (`INLINE_MAX` 257→256)

**Quelle:** Plan 15-07, Task 3. Übernommen unverändert aus `15-07-SUMMARY.md` §
„Ratschen-Beweis (D-49) — Task 3, Inline-Stil-Ratsche".

```
Ausgangswert vor der Löschung: 257 (bestätigt in 15-06)
Nach Löschung des PWA-Banner-Markups (genau 1 style="-Vorkommen):
gemessen -> 256

INLINE_MAX = 255 (Testlauf):
  Expected: <= 255
  Received:    256
  Test failed (ROT) — Exit-Code ungleich 0

INLINE_MAX = 256 (Testlauf):
  Tests: 67 passed, 67 total (GRÜN) — Exit-Code 0
```

Zwei protokollierte Exit-Codes, einer davon ungleich 0 — Kriterium erfüllt. Diese Sitzung bestätigt
den Ist-Wert 256 erneut (Messblock 2) — keine weitere Senkung in diesem Plan, wie erwartet.

## Offene Annahmen dieser Phase

Damit Phase 16-19 diese vier Punkte nicht für gemessene Tatsachen halten:

1. **Die drei kolportierten Löschzahlen** (438 tote Klassen / 607 Regelblöcke / ~3.174 Zeilen aus
   dem externen Design-Handoff) wurden in KEINEM Plan dieser Phase reproduziert. Plan 15-06 hat sie
   durch die werkzeuggemessenen Zahlen ersetzt (738/757/5.762, vor der Löschung); nach dem
   Löschlauf (Plan 15-07, diese Baseline Messblock 5) stehen 0 tote Regelblöcke und 209 (204
   relevante) verbliebene tote Klassennamen in Komma-/Verbundselektoren. Nur die
   Gesamtzeilenzahl von `assets/styles/` (27.141 vor Phase 15) hatte sich in einer unabhängigen
   Nachmessung bestätigt — sonst nichts aus dem Handoff.
2. **Die Trefferzahl der toten `.skeleton`-Platzhalter-Familie** (Plan 15-01): `15-CONTEXT.md`
   nannte 12 Treffer; die eigene Messung (`grep -rn "skeleton" assets/styles/ features/ systems/
   ui/ core/ render/ utils/ assets/templates/`) ergab **11**, alle in `dmscreen.css`, VOR der
   Löschung dieser Familie. Die eigene Messung wurde als maßgeblich verwendet (Pitfall 3 aus
   `15-RESEARCH.md` bestätigt), die Abweichung zur Dokumentation ist hier ausdrücklich festgehalten,
   nicht stillschweigend übernommen.
3. **Der Restbestand regelfreier DM-Screen-Widget-Klassen** (Plan 15-04, `DMS_UNSTYLED_MAX`): die
   ursprünglich in `15-CONTEXT.md`s Deferred-Ideas-Notiz erwartete Zahl war 9 (zwei Klassen des
   Wissensgebiete-Widgets sollten bleiben). D-10 verlangt jedoch ausdrücklich die Reparatur ALLER
   DREI Referenzwidgets, nicht nur zweier — Plan 15-04 folgte D-10 statt der widersprüchlichen
   Deferred-Notiz, wodurch der tatsächliche Restbestand bei 7 statt 9 liegt (`dms-know-skill`/
   `dms-know-types` sind jetzt gestylt und verlassen die Liste). Diese Abweichung ist eine vom Plan
   selbst verlangte Entscheidung, keine Ausführungsabweichung — hier zur Vollständigkeit dennoch
   benannt, weil Phase 16-19 sonst die Deferred-Notiz für die aktuelle Zahl halten könnten.
4. **Sieben Randfälle aus der deterministischen Sondierung** (`15-EDGE-COVERAGE.json`, protokolliert
   in `15-01-PLAN.md` § „Flagged Assumptions") konnten keinem Randfall-Typ zugeordnet werden
   (`unclassified`) und sind ausdrücklich als offene Planerannahme geführt, nicht als geschlossen
   behauptet: BASE-03 (Dokumentschluss ohne Datenform — angenommen: Widerlegung vollständig, wenn
   Markierung und Zeilenspanne stimmen), BASE-04 (Verfahrensregel ohne Datenpfad — angenommen:
   erfüllt, wenn jede Ratsche mit ihrem eigenen Testausdruck gemessen wurde; siehe diese Baseline
   selbst als Beleg), DEAD-02 (Erkennungsregel — angenommen: die ≥20-Klassen-Stichprobe aus Plan
   15-06 ersetzt eine formale Randfallanalyse), FIX-03 (zwei Klassenzuweisungen — angenommen: die
   drei Fälle gewöhnlich/kritisch/Patzer decken den Zustandsraum vollständig ab), GATE-03
   (Verfahrensregel — angenommen: die beidseitige Rot-Grün-Checkliste selbst ist der Randfalltest),
   GATE-04 (Geltungsbereichs-Entscheidung — angenommen: Vollständigkeit über sechs Befundgruppen ist
   die Abnahme), GATE-05 (Abnahmeform — angenommen: erfüllt, wenn Stufe 1/2 automatisch laufen und
   Stufe 3 protokolliert stattfindet, siehe „Vier-Themes-Sichtung" in `15-08-SUMMARY.md`).

---
*Phase: 15-befundlage-vorlauf*
*Plan: 08*
*Erhoben: 2026-09-09*
