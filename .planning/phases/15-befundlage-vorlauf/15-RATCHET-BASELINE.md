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

## Messblock 8 — Neumessung des Pruefmodus nach dem CR-01/WR-01-Fix (Plan 15-09)

**Datum:** 2026-09-09
**Anlass:** Der Code-Review (`15-REVIEW.md`, CR-01/WR-01) hat eine reale Blindstelle in
`tools/css-usage-report.js`s Lebend-Erkennung bewiesen: eine Zuweisung an die Klassenlisten-
Eigenschaft mit einer Ternary rechts vom Gleichheitszeichen (`.className = bedingung ? 'a' : 'b';`),
die Objektschluessel `containerClass:`/`className:`, und ein `classList.toggle()`-Aufruf mit einem
geklammerten Ausdruck vor dem Klassenliteral wurden nicht als Klassen-Kontext erkannt. Genau dieses
Muster hatte in Plan 15-07 zur Loeschung der Regelbloecke `.npc-grid` (`assets/styles/npcs.css`) und
`.list-view-container` (`assets/styles/encounters.css`) gefuehrt (`ui/dom-builder.js:393`,
`ui/safe-render.js:360`). Plan 15-09 hat die Erkennung mechanisch erweitert und beide Bloecke
woertlich aus Commit `4faca38` wiederhergestellt.

**Rot-Gruen-Protokoll (GATE-03), Task 1 und Task 2:**

```
Task 1 — vier neue Faelle gegen das UNVERAENDERTE Werkzeug:
npx jest tests/unit/css-usage-report.test.js
Tests:       4 failed, 23 passed, 27 total
Exit-Code:   1
Fehlgeschlagene Faelle: CR-01a, CR-01b, CR-01c, WR-01

Task 2 — nach der Erweiterung von collectLiveTokens():
npx jest tests/unit/css-usage-report.test.js
Tests:       27 passed, 27 total
Exit-Code:   0
```

**Befehle der Neumessung:**

```
node tools/css-usage-report.js --json
```

**Vorher-/Nachher-Tabelle (tote Klassen ausserhalb der Ausnahmeliste, `checkFailures.length`):**

| Zeitpunkt | Wert | Quelle |
|---|---|---|
| Vorher (Ausgangswert, `15-RATCHET-BASELINE.md` Messblock 6, Plan 15-08) | 204 | `node tools/css-usage-report.js --check` |
| Nachher (diese Sitzung, nach Task 2 + Task 3) | **199** | `node tools/css-usage-report.js --json`, `checkFailures.length` |

Die Zahl ist frisch gemessen, nicht aus der Planungsmessung (Objective-Abschnitt von
`15-09-PLAN.md`, dort ebenfalls 199 als Simulation) uebernommen — beide stimmen ueberein, was die
Simulation bestaetigt, ersetzt aber nicht die eigene Messung (DEAD-03-Prinzip). Zwei
aufeinanderfolgende Laeufe von `node tools/css-usage-report.js --json` liefern byte-gleiche
Ausgabe.

**Namentlich freigegebene Klassen (in `checkFailures` VORHER enthalten, NACHHER nicht mehr):**

`location`, `negative`, `npc`, `npc-grid`, `positive`

**Interpretation:** `npc-grid` und `list-view-container` stehen nach der Wiederherstellung in
`assets/styles/` UND werden vom erweiterten Werkzeug sofort als lebendig erkannt — keine der beiden
Klassen erscheint zu irgendeinem Zeitpunkt dieser Sitzung in `checkFailures`. Die drei weiteren
freigegebenen Klassen (`location`, `negative`, `npc`) sind Nebeneffekte derselben
Erkennungserweiterung (Ternary-Zweige realer, unabhaengiger `.className=`-Zuweisungen im
Quellbaum) und keine Restaurierung — sie waren nie geloescht, nur faelschlich als tot gemeldet.
`DEAD_EXCEPTIONS` bleibt unveraendert bei fuenf Eintraegen, `LIVE_PREFIXES` unveraendert bei fuenf.
Der verbleibende `--check`-Restbefund aus Messblock 6 (Ankerregel-Ueberlebende in Verbund-/
Kommaselektoren) ist durch diesen Plan NICHT geschlossen — er ist eine strukturelle Grenze der
Textpruefung ohne echten JS-Parser, vertagt in `deferred-items.md`.

## Messblock 9 — CLAUDE.md CSS-Dateizahl widerspruchsfrei, Waechter-Rot-Gruen-Beweis (Plan 15-10)

**Datum:** 2026-09-09
**Anlass:** `15-VERIFICATION.md` (Gap 2, "partial") hat bewiesen, dass Plan 15-02s Korrektur der
CSS-Dateizahl in CLAUDE.md nur an EINER von drei Stellen ankam (Zeile 144, Modul-Organisations-
Tabelle). Zeile 523 (Roadmap-Tabelle) und Zeile 759 samt Struktur-Codeblock (Abschnitt "CSS
Organization for New Features") nannten weiterhin 13 statt 20 und listeten sieben Dateien nicht.
Ursache war eine woertliche Ein-Sprachen-Abnahme (`grep -c "13 modulare CSS-Dateien" CLAUDE.md ==
0`), die die englische Formulierung "split into 13 modular files" an zwei Stellen nicht sah.

**Messbefehl fuer die Dateizahl:**

```
ls assets/styles/*.css | wc -l
-> 20
```

Dieser Wert ist der einzige, der ab diesem Plan an allen drei Stellen in CLAUDE.md steht (Zeile
144, Zeile 523, Zeile 759 samt Struktur-Codeblock).

**Rot-Gruen-Protokoll (GATE-03/D-49), Task 1 und Task 2:**

```
Task 1 — vier neue Faelle (DOC-01..DOC-04) gegen das UNVERAENDERTE CLAUDE.md:
npx jest tests/unit/docs-consistency.test.js
Tests:       3 failed, 1 passed, 4 total
Exit-Code:   1
Fehlgeschlagene Faelle: DOC-02, DOC-03, DOC-04 (DOC-01 gruen)

Task 2 — nach der Korrektur an allen drei Stellen von CLAUDE.md:
npx jest tests/unit/docs-consistency.test.js
Tests:       4 passed, 4 total
Exit-Code:   0

Vollstaendige Suite danach:
npx jest
Tests:       1251 passed, 1251 total (55 Suiten, 50 Snapshots)
Exit-Code:   0
```

Zwei protokollierte Zustaende, Exit-Code 1 vor der Korrektur und 0 danach — Kriterium erfuellt.
Ein Test, der nie rot war, haette nichts bewiesen; hier ist der rote Zustand exakt die drei
Stellen, die `15-VERIFICATION.md` als widersprochen benannt hat, kein anderer.

**Entscheidung: Zeilenzahlen-Spalte im Struktur-Codeblock entfernt, nicht neu gemessen.** Die
bisherige Klammerangabe je Datei (z.B. `variables.css (260)`, `dashboard.css (3433)`) war bereits
vor dem Loeschlauf der Phase 15 grob falsch — die tatsaechliche Zeilenzahl von `variables.css` lag
zum Planungszeitpunkt bei weit ueber dem Doppelten des genannten Werts, die von `dashboard.css`
bei etwa der Haelfte. Eine Zahl, die sich bei jeder CSS-Aenderung verschiebt und die kein Test
schuetzt, waere beim naechsten Mal wieder falsch gewesen (BASE-01/empty-Prinzip: eine nicht
messbar geschuetzte Angabe wird weggelassen, nicht geraten). An ihre Stelle tritt unter dem
Struktur-Codeblock eine Zeile mit Stand-Datum und dem woertlichen Messbefehl. Die Reihenfolge der
Auflistung ist ab jetzt die Kaskadenreihenfolge des `@import`-Hubs in `assets/styles.css` — damit
nicht nur richtig, sondern durch DOC-04 auch dauerhaft pruefbar.

**Was dieser Plan NICHT schliesst (GATE-04/unclassified, ausdruecklich unberuehrt):** Der in
CLAUDE.md selbst gefuehrte fehlende Werkzeugleisten-Wächtertest (Abschnitt "Editor-Werkzeugleisten
(Variante 2a, 2026-09-07)", "Kein Wächtertest") bleibt unveraendert offene Restschuld — dieser Plan
schliesst genau den einen Befund, den `15-VERIFICATION.md` Gap 2 benannt hat, und formuliert keine
andere Restschuld als erledigt um.

## Messblock 10 — Neumessung des Pruefmodus nach dem CR-02/CR-03-Fix (Plan 15-11)

**Datum:** 2026-09-11
**Anlass:** `15-VERIFICATION.md` und `15-REVIEW.md` (CR-02/CR-03) haben drei verbliebene
Erkennungsluecken in `tools/css-usage-report.js`s Lebend-Erkennung benannt, die Plan 15-09
uebriggelassen hatte:

1. `scanBalancedSegment()` brach bei jedem Zeilenumbruch ab — eine ueber zwei Zeilen umbrochene
   Zuweisung an die Klassenlisten-Eigenschaft (Prettier-Normalform, reale Fundstelle
   `features/dice/dice-core.js:379-381`) lieferte ein leeres Segment.
2. Der Inhalt einer `${...}`-Interpolation wurde an zwei Stellen vollstaendig verworfen — im
   Projekt das dominierende Idiom fuer bedingte Klassen (reale Fundstelle
   `features/shops/shops-core.js:596`).
3. Die Zwischenvariablen-Form (ein Ternary in eine Variable, die Variable danach in eine
   `class=`-Zeichenkette konkateniert) war ueberhaupt kein Klassen-Kontext des Werkzeugs (reale
   Fundstellen `features/fraktionen/fraktionen-render.js` und `features/initiative-mob.js`).

Plan 15-11 hat alle drei Luecken mechanisch geschlossen: Interpolations-Literal-Ernte (CR-03a,
Task 1), eine harte Zeichen-Obergrenze `MAX_SEGMENT_SCAN_CHARS` (2000) statt der
Umbruchschranke (CR-02, Task 2), und eine vierte Kontextregel `collectConcatVarLiterals()` fuer
die Zwischenvariablen-Form (CR-03b, Task 3).

**Rot-Gruen-Protokoll (GATE-03), alle drei Tasks:**

```
Task 1 — CR-03a gegen das unveraenderte Werkzeug:
npx jest tests/unit/css-usage-report.test.js
Tests:       1 failed, 27 passed, 28 total
Exit-Code:   1
Fehlgeschlagener Fall: CR-03a

Task 1 — nach der Interpolations-Literal-Ernte:
npx jest tests/unit/css-usage-report.test.js
Tests:       28 passed, 28 total
Exit-Code:   0

Task 2 — CR-02a/CR-02b gegen den Stand nach Task 1 (CR-02c bereits gruen, da die alte
Umbruchschranke den Scan noch frueher beendete):
npx jest tests/unit/css-usage-report.test.js
Tests:       2 failed, 29 passed, 31 total
Exit-Code:   1
Fehlgeschlagene Faelle: CR-02a, CR-02b

Task 2 — nach dem Ersatz der Umbruchschranke durch MAX_SEGMENT_SCAN_CHARS:
npx jest tests/unit/css-usage-report.test.js
Tests:       31 passed, 31 total
Exit-Code:   0

Task 3 — CR-03b gegen den Stand nach Task 2 (CR-03c bereits gruen — Praezisions-Gegenprobe, muss
es bleiben):
npx jest tests/unit/css-usage-report.test.js
Tests:       1 failed, 32 passed, 33 total
Exit-Code:   1
Fehlgeschlagener Fall: CR-03b

Task 3 — nach der vierten Kontextregel (collectConcatVarLiterals):
npx jest tests/unit/css-usage-report.test.js
Tests:       33 passed, 33 total
Exit-Code:   0
```

**Befehl der Neumessung:**

```
node tools/css-usage-report.js --json
```

**Vorher-/Nachher-Tabelle (tote Klassen ausserhalb der Ausnahmeliste, `checkFailures.length`):**

| Zeitpunkt | Wert | Quelle |
|---|---|---|
| Vorher (Ausgangswert, `15-RATCHET-BASELINE.md` Messblock 8, Plan 15-09) | 199 | `node tools/css-usage-report.js --json`, `checkFailures.length` |
| Nachher (diese Sitzung, nach Task 1+2+3) | **159** | `node tools/css-usage-report.js --json`, `checkFailures.length` |

Die Zahl ist frisch gemessen (Vergleich des unveraenderten Werkzeugs beim Ledger-Basis-Commit
dieses Plans gegen den Stand nach allen drei Tasks), nicht fortgeschrieben (DEAD-03-Prinzip).
Zwei aufeinanderfolgende Laeufe von `node tools/css-usage-report.js --json` liefern weiterhin
byte-gleiche Ausgabe.

**Namentlich freigegebene Klassen (40, in `checkFailures` VORHER enthalten, NACHHER nicht mehr):**

`ally`, `arcana`, `available`, `bloodied`, `buff`, `character`, `completed`, `critical`, `custom`,
`defeated`, `ds-toggle-btn--active`, `error`, `expertise`, `expired`, `filled`, `full`, `gestik`,
`half`, `has-children`, `healing`, `healthy`, `hidden`, `history`, `inactive`, `investigation`,
`locations-list`, `material`, `misc`, `missing`, `nature`, `pinned`, `player`, `plot`, `proficient`,
`religion`, `sb-file-warn`, `si-unavailable`, `side`, `srd`, `verbal`

Keine Klasse ist im Vergleich NEU in `checkFailures` aufgetaucht (0 newly-dead) — die Erweiterung
ist strikt konservativ, sie erklaert nur mehr Klassen fuer lebendig, nie weniger.

**Interpretation:** Alle vier von `15-VERIFICATION.md`/`15-REVIEW.md` namentlich benannten
Klassen (`si-unavailable`, `filled`, `proficient`, `hidden`) stehen nach diesem Plan nachweislich
NICHT mehr in `checkFailures`. `DEAD_EXCEPTIONS` bleibt unveraendert bei fuenf Eintraegen,
`LIVE_PREFIXES` unveraendert bei fuenf — kein einziger Klassenname wurde fuer diese Erweiterung
in eine Ausnahmeliste eingetragen, die Erweiterung ist durchgehend mechanisch.

**Ausdruecklich festgehalten: `.planning/WINDOWS.md` bleibt in diesem Plan bewusst unberuehrt.**
Eintrag 5 traegt weiterhin die Zahl 199 (nicht die hier gemessenen 159) — er wird ERST durch
Plan 15-12 nachgezogen, nachdem auch die dortigen Wiederherstellungen stehen. Eine zwischenzeitliche
Aktualisierung wuerde die Registerzahl innerhalb derselben Welle zweimal umschreiben und waere
zwischendurch weder der alte noch der neue Stand.

**Was dieser Plan NICHT schliesst:** Die 159 verbleibenden `checkFailures` sind (wie bereits bei
Messblock 8 dokumentiert) ueberwiegend Ankerregel-Ueberlebende in Verbund-/Kommaselektoren mit
mindestens einer lebenden Geschwisterklasse — eine strukturelle Grenze der Textpruefung ohne
echten JS-Parser, unveraendert in `deferred-items.md` dieser Phase gefuehrt (Punkt 2). GATE-05
Stufe 3 (die menschliche Vier-Themes-Sichtung) wurde durch diesen Plan NICHT durchgefuehrt — dieser
Plan aendert kein ausgeliefertes CSS oder Laufzeit-JavaScript, nur ein Bauzeit-Werkzeug und seine
Testdatei.

## Messblock 11 — Gegenprobe des GESAMTEN Loeschstands, Wiederherstellung und Endstand (Plan 15-12)

**Datum:** 2026-09-11
**Anlass:** `15-REVIEW.md` CR-01 hat bewiesen, dass Plan 15-09 nur die zwei damals namentlich
bekannten Faelle (`.npc-grid`, `.list-view-container`) nachgeprueft hat — eine Gegenprobe des
GESAMTEN Loeschstands der Welle aus Plan 15-07 wurde nie gefahren. Plan 15-12 hat diese Gegenprobe
zu einem dauerhaften Testfall (`tests/unit/css-deletion-audit.test.js`) gemacht, gegen eine
versionierte Klassenmenge vor der Loeschwelle (`tests/fixtures/css-classes-before-15-07.json`,
Bezugscommit `09cb913dc389bda68ceb04df3cd46f5dfcd60b6b`, 2754 Klassen).

**Rot-Gruen-Protokoll (GATE-03), Task 1 und Task 2:**

```
Task 1 — DEL-02 gegen den unveraenderten Baum (vor jeder Wiederherstellung):
npx jest tests/unit/css-deletion-audit.test.js
Tests:       1 failed, 2 passed, 3 total
Exit-Code:   1
DEL-02 nennt 22 Klassen: description, dice-char-select, dice-crit, dice-fail,
dice-formula-history, dice-history, divider, enc-search, encounter,
fr-hist-minus, fr-hist-plus, init-mob-dmg-inputs, loc-search, loot,
loot-search, npc-header, npc-search, party, shop-meta-tag, timer-list,
timer-name, timer-presets

Task 2 — nach Wiederherstellung der acht genuinen Regelbloecke (6 Familien)
und Dokumentation der 15 bestaetigten Detektor-Fehlalarme als
KNOWN_FALSE_POSITIVES im Testfile:
npx jest tests/unit/css-deletion-audit.test.js
Tests:       3 passed, 3 total
Exit-Code:   0
```

**Klassenzahlen vor/heute/Loeschmenge (aus dem Gegenprobe-Lauf selbst):**

| Kennzahl | Wert |
|---|---|
| Klassen vor der Loeschwelle (Fixture, Commit `09cb913`) | 2754 |
| Davon heute noch/wieder in `assets/styles/` vorhanden | (2754 − Loeschmenge) |
| Loeschmenge (DEL-03, in Fixture vorhanden, heute nicht mehr) | > 0, bestaetigt nicht-leer |

**Namentlich wiederhergestellte Klassen, mit Herkunftscommit (woertlich aus dem Elternstand):**

| Klasse(n) | Datei | Herkunftscommit (Elternstand) |
|---|---|---|
| `.shop-meta-tag` (+ `:hover`, `.npc`, `.location`) | `assets/styles/loot.css` | `4ed26ad9b4fdefb9294e93120b39c29ba40c56ab^` |
| `.si-unavailable` (Basisregel) | `assets/styles/loot.css` | `4ed26ad9b4fdefb9294e93120b39c29ba40c56ab^` |
| `.fr-hist-plus`, `.fr-hist-minus` | `assets/styles/welt.css` | `c83b8cca10461dae15e0a8f756a3e3e9c21555cc^` |
| `.init-mob-dmg-inputs` (+ `.hidden`, `input`) | `assets/styles/initiative.css` | `2fc147ed2459e1f9908e437076af63d5adfe1487^` |
| `.npc-header` | `assets/styles/npcs.css` | `e743f8d6bb99cb92626d906ab044c710d9845d8d^` |
| `.dice-crit`, `.dice-fail` | `assets/styles/dashboard.css` | `a37e17e7aac46ca70224971d80ad71a4b51af369^` |

**Frisch gemessene Endzahl des Pruefmodus:**

```
node tools/css-usage-report.js --json  ->  checkFailures.length = 159
```

Unveraendert gegenueber Messblock 10 (auch 159) — die Wiederherstellungen betreffen ausschliesslich
Klassen, die bereits als lebendig erkannt wurden (sie standen in `checkFailures` nie drin); ihre
Wiederherstellung aendert die Zahl der TOTEN Klassen folglich nicht.

**Entscheidung zu den zwei Faellen ohne heutige Laufzeitwirkung:** `npc-header` (kein Aufrufer von
`renderNPCCard()`, `ui/dom-builder.js`) und `dice-crit`/`dice-fail` (Rueckfallzweig in
`features/dice/dice-core.js:374-382` schreibt auf ein in keiner Vorlage existierendes Element)
wurden TROTZDEM wiederhergestellt, nicht der unerreichbare JS-Pfad geloescht: der Loeschgrund waere
"dieser JS-Pfad ist unerreichbar", nicht "diese Klasse ist tot" (sie ist es nicht), und das ist ein
anderer Befund mit anderem Pruefbedarf, der die Phasengrenze dieser Luekenschluss-Welle
ueberschreiten wuerde (siehe `deferred-items.md` Eintrag 4).

**Detektor-Fehlalarm, entdeckt in dieser Sitzung (NEUER Befund, ueber die Planung hinaus):** Der
volle Gegenprobe-Lauf nannte 22 statt der sechs aus `15-REVIEW.md` CR-01 erwarteten
Klassenfamilien. Die zusaetzlichen 15 (`description`, `dice-char-select`, `dice-formula-history`,
`dice-history`, `divider`, `enc-search`, `encounter`, `loc-search`, `loot`, `loot-search`,
`npc-search`, `party`, `timer-list`, `timer-name`, `timer-presets`) sind KEINE echten
Fehlloeschungen, sondern reproduzierbare Fehlalarme von `collectConcatVarLiterals()` (Plan 15-11,
CR-03b): ein kurzer, mehrfach verwendeter Bezeichner (`c`, `select`, `searchEl`, `viewMap`, ...)
wird ueber eine voellig unabhaengige `$('irgendeine-id')`-Referenz oder Objekt-/Array-Literal
deklariert, deren Wert zufaellig wortgleich mit einer echt geloeschten CSS-Klasse ist; der
anweisungsweite Vorwaertsscan des Detektors greift diesen Bezeichner spaeter im selben, nur
klammertiefen-gebundenen Anweisungsfenster faelschlich auf. Vollstaendige Herleitung je Klasse in
`deferred-items.md` Eintrag 6. Diese 15 Klassen wurden NICHT als CSS wiederhergestellt (das haette
genuinely-totes CSS erneut in den Baum geholt, teils in Dateien ausserhalb des `files_modified`
dieses Plans), sondern als datierte, einzeln begruendete `KNOWN_FALSE_POSITIVES`-Ausnahmeliste im
Testfile selbst gefuehrt. `tools/css-usage-report.js` bleibt in dieser Welle unangetastet
(Planvorgabe); die Detektor-Korrektur ist eine eigene, kuenftige, architektonische Aenderung.

**GATE-05 Stufe 3 (menschliche Vier-Themes-Sichtung) wurde durch diesen Plan NICHT durchgefuehrt.**
Sie bleibt Plan 15-14 vorbehalten.

## Messblock 12 — Stil-Vergleichslauf von einer dekorativen in eine lasttragende Pruefung verwandelt (Plan 15-13)

**Datum:** 2026-09-11
**Node-Version:** v24.14.0

**Anlass:** `15-VERIFICATION.md` Gap 2 (deckungsgleich mit `15-REVIEW.md` CR-04) hat vier
voneinander unabhaengige Maengel in `tests/e2e/features/computed-style-diff.spec.js` benannt, die
zusammen bewirkten, dass die als dritte Nachweissaeule gedachte Pruefung die Art Regression, die
Phase 15 tatsaechlich produziert hat, strukturell nicht sehen konnte:

1. Der Sollstand lag unter `tests/e2e/test-results/`, per `.gitignore:25` ausgeschlossen — in CI
   und jedem frischen Klon war der Vorlauf `null`, der Vergleich lief sofort gruen ohne zu
   vergleichen.
2. Der Sollstand wurde in allen drei Faellen VOR der Zusicherung geschrieben — ein Lauf, der eine
   Abweichung meldet, schrieb sie im selben Atemzug als neuen Sollstand fest.
3. `diffPass()` iterierte ausschliesslich ueber die Schluessel des AKTUELLEN Durchgangs und
   uebersprang Schluessel, die im Vorlauf fehlten — ein durch eine geloeschte Regel unsichtbar
   gewordenes Element verschwand lautlos aus dem Vergleich, UND (die schwerste Richtung) ein durch
   eine geloeschte Ausblendregel neu sichtbar gewordenes Element wurde als "neuer Schluessel"
   ebenso uebergangen.
4. Alle drei Durchgaenge liefen gegen die leere Kampagne (`seedCleanSession`) — die
   Entitaets-Markups, auf die die in Plan 15-12 wiederhergestellten Regeln wirken, wurden nie
   gerendert; zwei davon (Shop-Artikelbereich, Fraktions-Ruf-Historie) zusaetzlich nur im
   aufgeklappten Shop bzw. bei ausgewaehlter Fraktion.

### Checkpoint-Entscheidung: Form des versionierten Sollstands

Vor Task 1 wurde ein `checkpoint:decision` gestellt (drei Optionen: A Vollabzug, B Kurzform/Digest,
C Hybrid). **Der Mensch waehlte C (Hybrid, die Empfehlung des Plans)** am 2026-09-11: der
verbindliche, eingecheckte Sollstand ist eine Kurzform — je Ansicht und Elementschluessel ein
stabiler Hash ueber die zwoelf Eigenschaften, plus die vollstaendige Schluesselmenge; der Vollabzug
wird weiterhin unter dem ausgeschlossenen Ergebnisverzeichnis geschrieben und dient der oertlichen
Fehlersuche. Begruendung (aus dem Checkpoint-Kontext): ein je Phase neu geschriebener
Mehrmegabyte-Sollstand waechst die Git-Historie dauerhaft und ist nicht folgenlos zuruecknehmbar;
die Kurzform erkennt Wertaenderungen UND beide Richtungen der Schluesselmengen-Aenderung genauso
zuverlaessig, bei deutlich kleinerem Umfang, und ihr Diff bleibt zeilenweise lesbar.

Umsetzung: `digestElement()` in `computed-style-diff.spec.js` haelt einen auf 16 Hex-Zeichen (64
Bit) gekuerzten SHA-256 je Element — der volle 256-Bit-Hash waere fuer eine Kollisionsdomaene von
wenigen tausend Elementen je Lauf deutlich ueberdimensioniert; 64 Bit halten die
Kollisionswahrscheinlichkeit astronomisch klein und tragen den Groessenvorteil der Kurzform
tatsaechlich in die Datei.

### Messbefehl fuer die Groesse (woertlich)

```
wc -c tests/e2e/baselines/computed-style-baseline.json tests/e2e/test-results/computed-style-snapshot.json
328261 tests/e2e/baselines/computed-style-baseline.json
1661269 tests/e2e/test-results/computed-style-snapshot.json
1989530 total
```

Der versionierte Sollstand (Kurzform) ist **328.261 Byte** (~321 KiB) gross — rund 5x kleiner als
der lokale Vollabzug (~1,58 MiB), der weiterhin unter dem ausgeschlossenen Ergebnisverzeichnis
entsteht. Diese Zahl ist die Grundlage, an der die Phasen 16-19 den Aufwand ihrer eigenen
Neuerhebung abschaetzen.

### Elementzahl je Ansicht: befuellter Seed gegen den vorigen Leerzustand

Gemessen mit einer instrumentierten, nicht committeten Wegwerf-Kopie des Erfassungscodes vor
Task 2 (einmal mit `seedCleanSession`, einmal mit `seedPopulatedSession` inklusive
Zustandsherstellung) gegen dasselbe gebaute Buendel:

| Ansicht | Leerzustand | Befuellter Seed | Differenz |
|---|---|---|---|
| party | 23 | 105 | +82 |
| shops | 21 | 64 | +43 |
| fraktionen | 16 | 59 | +43 |
| initiative | 29 | 81 | +52 |

Diese vier Werte sind gleichzeitig `MIN_ELEMENTS_ABOVE_EMPTY` in `computed-style-diff.spec.js` —
die Schranke, die einen stillen Ruckfall auf Leerzustands-Markup fuer diese vier Ansichten rot
macht.

### Rot-Gruen-Protokoll (GATE-03), Task 1 — Regressionsspec, beidseitiger Beweis der Mob-Ausblendregel

```
Ohne .init-mob-dmg-inputs.hidden (Regel entfernt):
npx playwright test tests/e2e/features/css-restore-regression.spec.js --reporter=list
1 failed (REG-04: Expected "none", Received "flex"), 4 passed
Exit-Code: 1

Mit .init-mob-dmg-inputs.hidden (Regel wiederhergestellt):
npx playwright test tests/e2e/features/css-restore-regression.spec.js --reporter=list
5 passed
Exit-Code: 0
```

Zwei protokollierte Exit-Codes, einer davon ungleich 0 — Kriterium erfuellt.
`git status --porcelain assets/styles/` nach dem Beweis: leer.

### Rot-Gruen-Protokoll (GATE-03), Task 3 — drei Befundarten des reparierten Vergleichslaufs

Alle drei Proben gegen den frisch gebauten Baum, jeweils `npx playwright test
tests/e2e/features/computed-style-diff.spec.js --reporter=list` OHNE `UPDATE_STYLE_BASELINE`:

**(a) Wertaenderung** — `.si-unavailable { opacity: 0.5 }` voruebergehend auf `0.4` geaendert:

```
ROT:   1 failed — "shops/div.misc.si-item.si-unavailable#0: Digest geaendert (Werte im lokalen
       Vollabzug tests/e2e/test-results/computed-style-snapshot.json)"
       Exit-Code: 1
GRUEN: nach Ruecknahme — 3 passed, Exit-Code: 0
```

**(b) Verschwundenes Element** — `.fr-hist-minus` voruebergehend `display: none;` ergaenzt:

```
ROT:   1 failed — "fraktionen/span.fr-hist-delta.fr-hist-minus#0: Element im Vorlauf vorhanden,
       jetzt nicht mehr erfasst"
       Exit-Code: 1
GRUEN: nach Ruecknahme — 3 passed, Exit-Code: 0
```

**(c) Neu erschienenes Element** — `.init-mob-dmg-inputs.hidden { display: none; }` voruebergehend
entfernt (dieselbe Regression wie Task 1, jetzt gegen den reparierten Stil-Vergleichslauf statt
gegen den Regressionsspec):

```
ROT:   1 failed — drei neue Schluessel gemeldet:
       "initiative/div.hidden.init-mob-dmg-inputs#0: Element im Vorlauf nicht vorhanden, jetzt neu
       erfasst", "initiative/input.init-mob-ac-input#0: ... jetzt neu erfasst",
       "initiative/input.init-mob-bonus-input#0: ... jetzt neu erfasst"
       Exit-Code: 1
GRUEN: nach Ruecknahme — 3 passed, Exit-Code: 0
```

Sechs protokollierte Exit-Codes (drei Proben je rot/gruen), drei davon ungleich 0 — Kriterium
erfuellt. Nach jeder Probe: `git status --porcelain assets/styles/` leer (vollstaendige
Ruecknahme bestaetigt).

### Schreibsperren-Probe (T-15-27)

Waehrend Probe (a) im ROTEN Zustand: der Sollstand vor dem roten Lauf gesichert, der rote Lauf OHNE
`UPDATE_STYLE_BASELINE` gefahren, danach `diff` gegen die Sicherung:

```
diff <Sicherung vor dem roten Lauf> tests/e2e/baselines/computed-style-baseline.json
(keine Ausgabe — byte-gleich)
```

Ein Lauf, der eine Abweichung findet, schreibt sie NICHT als neuen Sollstand fest — die
Schreibsperre haelt auch im roten Zustand.

### Reproduzierbarkeits-Nebenfund: animierte Elemente ausgeschlossen

Beim ersten Reproduzierbarkeits-Lauf (unveraenderter Baum, kein Schalter) meldete der Lauf einen
FALSCHEN roten Befund: `dmscreen/span.dms-live-badge#0` hat `animation: dms-live-pulse 2s
ease-in-out infinite;` (pulsiert `opacity` zwischen 1 und 0.6) — zwei Erfassungen desselben
unveraenderten Baums lieferten je nach Zeitpunkt im Animationszyklus unterschiedliche `opacity`-
Werte. Das ist reines Zeitrauschen, keine Stiländerung. Behoben durch Ausschluss laufend
animierter Elemente (`getComputedStyle(el).animationName !== 'none'`) aus der erfassten Menge in
`captureViewInBrowser()` — analog zum bestehenden Ausschluss von `width`/`height`. Nach der
Korrektur: drei aufeinanderfolgende Laeufe gegen den unveraenderten Baum, alle drei gruen,
Sollstand byte-gleich (siehe Schreibsperren-Probe oben).

### Vollstaendige Abnahme, Abschlusslauf dieser Sitzung

| Suite | Befehl | Ergebnis |
|---|---|---|
| Jest (gesamt) | `npx jest` | **1260/1260 bestanden** (56 Suiten, 50 Snapshots) |
| Playwright (gesamt) | `npx playwright test --reporter=list` | **369 bestanden / 2 skipped**, 0 fehlgeschlagen (364 vorher + 5 neu: REG-01..REG-05) |
| pytest (Build-Tests) | `PYTHONIOENCODING=utf-8 python -m pytest tests/build -q` | **24/24 bestanden** |
| Build (Development) | `PYTHONIOENCODING=utf-8 python build.py` | **Exit 0** |
| Build (Production) | `PYTHONIOENCODING=utf-8 python build.py --production` | **Exit 0** |

**Deviation (Rule 3, blocking):** Zwei Kommentare in den neuen/geaenderten Testdateien nannten
`features/shops/shops-core.js` und `features/fraktionen/fraktionen-render.js` woertlich, was
`tests/unit/module-test-coverage.test.js`s Ratsche `nowCovered` faelschlich (aber diesmal
zutreffend — beide Module werden von `window.toggleShop()`/`window.selectFraktion()` jetzt
tatsaechlich zur Laufzeit durchlaufen) ausloeste; beide Eintraege wurden aus
`MODULE_TEST_EXCEPTIONS` gestrichen (die Liste darf nur schrumpfen). Ein dritter Treffer
(`features/party/party-crud.js`, reine Zitat-Erwaehnung im Seed-Kommentar ohne tatsaechlichen
Laufzeitaufruf) wurde auf die etablierte nicht-treffende Zitierkonvention umgestellt (Vorbild:
Plan 15-12 Deviation 1, dieselbe Datei). Siehe `15-13-SUMMARY.md` fuer Details.

**GATE-05 Stufe 3 (menschliche Vier-Themes-Sichtung) wurde durch diesen Plan NICHT durchgefuehrt.**
Sie bleibt ausdruecklich Plan 15-14 vorbehalten.

## Messblock 13 — Vorlagenzahl widerspruchsfrei, Waechter-Rot-Gruen-Beweis, Abschluss der Welle (Plan 15-14)

**Datum:** 2026-09-12
**Anlass:** `15-VERIFICATION.md` und `15-REVIEW.md` (WR-03/IN-06) haben bewiesen, dass derselbe
Fehlermodus wie in Messblock 9 (eine Zahl im Dokument, die niemand misst) ein zweites Mal vorlag —
diesmal bei der Vorlagenzahl. Der Waechter aus Plan 15-10 (DOC-02) klammert diese Zahl
AUSDRUECKLICH aus (sein Kandidatenfilter zaehlt "modulare HTML-Vorlagen" bewusst nicht mit), damit
er sich nicht mit einer kuenftigen Vorlagenpruefung gegenseitig rot faerbt. Genau diese
Ausklammerung liess die Vorlagenzahl unbewacht: `CLAUDE.md` Zeile 145 nannte 10, gemessen sind es
12. `15-REVIEW.md` (IN-06) hat die Ursache benannt: der Hinweiskommentar in `assets/body.html`
listet ebenfalls nur 10 Vorlagen und ist die nachgewiesene Quelle der falschen Abschrift.

**Messbefehl fuer die Vorlagenzahl:**

```
ls assets/templates/*.html | wc -l
-> 12
```

**Ladeliste in `loader.js` (TEMPLATES-Array), Eintragszahl:** 12 — Namensmenge identisch mit dem
Verzeichnis (DOC-05 gruen belegt das). Beide Zahlen stimmen ab diesem Plan an jeder Fundstelle in
`CLAUDE.md` sowie im Hinweiskommentar von `assets/body.html` mit dem gemessenen Wert ueberein.

**Rot-Gruen-Protokoll (GATE-03/D-49), Task 1 und Task 2:**

```
Task 1 — drei neue Faelle (DOC-05..DOC-07) gegen das UNVERAENDERTE CLAUDE.md/assets/body.html:
npx jest tests/unit/docs-consistency.test.js
Tests:       2 failed, 5 passed, 7 total
Exit-Code:   1
Fehlgeschlagene Faelle: DOC-06, DOC-07 (DOC-05 gruen, DOC-01..DOC-04 unveraendert gruen)

Task 2 — nach der Korrektur in CLAUDE.md Zeile 145 und im Hinweiskommentar von assets/body.html:
npx jest tests/unit/docs-consistency.test.js
Tests:       7 passed, 7 total
Exit-Code:   0
```

Zwei protokollierte Zustaende, Exit-Code 1 vor der Korrektur und 0 danach — Kriterium erfuellt.
Die zwei roten Faelle sind exakt die zwei Stellen, die `15-VERIFICATION.md`/`15-REVIEW.md` als
falsch benannt haben (die Dokumentzahl und der Hinweiskommentar), kein anderer Fall wurde
zufaellig rot mitgerissen.

### Entscheidung: Pruefung gegen ZWEI Quellen statt nur gegen das Verzeichnis

DOC-05 haelt die Vorlagenzahl NICHT nur gegen das Verzeichnis `assets/templates/`, sondern
zusaetzlich gegen die Ladeliste in `loader.js`, und zwar in Anzahl UND Namensmenge. Begruendung:
`CLAUDE.md` selbst (Abschnitt "Single Source of Truth for Modules/Templates/CSS", ARCH-01) haelt
fest, dass die Ladeliste die alleinige Registrierstelle fuer Vorlagen ist und dass `build.py` sie
zur Bauzeit ausliest — eine im Verzeichnis liegende, aber nicht geladene Datei wuerde bei einer
Pruefung, die nur das Verzeichnis zaehlt, stillschweigend mitgezaehlt und koennte eine falsche
Zahl decken, ohne dass der Waechter das je bemerkt. Ein Abweichen der beiden Quellen ist damit ein
eigener Befund (Verletzung der Einzelquellen-Regel) und darf nicht durch Waehlen einer der beiden
Zahlen uebergangen werden — genau das haelt DOC-05 fest, indem es beide Groessen UND die
Namensmenge vergleicht, nicht nur die Anzahl.

### Deviation (Rule 3, blocking): Plan-eigener Verify-Befehl fuer Task 2 hatte einen
Regex-Randfall-Fehler, `loader.js` blieb unveraendert

Der im Plan woertlich genannte automatisierte Verify-Befehl fuer Task 2,

```
test "$(ls assets/templates/*.html | wc -l)" = "$(grep -cE "^\s*'assets/templates/[a-z-]+\.html'," loader.js)"
```

zaehlt nur Zeilen, die mit einem Komma enden. Der LETZTE Eintrag des `TEMPLATES`-Arrays in
`loader.js` (`'assets/templates/modals-editors.html'`) traegt — gueltige JS-Array-Syntax — KEIN
Trennkomma, weil kein Eintrag mehr folgt. Der Befehl zaehlt deshalb nur 11 statt 12 Eintraege und
meldet einen Mismatch, obwohl Verzeichnis und Ladeliste tatsaechlich uebereinstimmen (12 = 12,
durch DOC-05 UND die eigene Namensmengenpruefung in `tests/unit/docs-consistency.test.js`
bewiesen). Der Plan verbietet ausdruecklich jede Aenderung an `loader.js` in diesem Plan ("KEINE
Aenderung an Produktionscode ... an `loader.js`"); ein Trennkomma haette den Verify-Befehl zum
Laufen gebracht, waere aber eine verbotene Produktionscode-Aenderung gewesen, nur um einen
Zaehl-Randfall in einem Shell-Einzeiler zu bedienen. Stattdessen mechanisch gleichwertiger Nachweis
gefuehrt, OHNE das Komma-Erfordernis:

```
grep -nE "^\s*'assets/templates/[a-z-]+\.html'" loader.js | wc -l
-> 12
```

12 Treffer, identisch mit `ls assets/templates/*.html | wc -l`. Der Mismatch war ein Fehler im
Verify-Befehl des Plans, kein Befund ueber den Baum. `loader.js` wurde in diesem Plan an keiner
Stelle geaendert (`git status --porcelain loader.js` leer, siehe Abschlusslauf unten).

### Vollstaendige Abnahme, Abschlusslauf der GESAMTEN Luekenschluss-Welle (Plaene 15-11 bis 15-14)

| Suite | Befehl | Ergebnis |
|---|---|---|
| Jest (gesamt) | `npx jest` | **1263/1263 bestanden** (56 Suiten, 50 Snapshots) |
| Playwright (gesamt) | `npx playwright test --reporter=list` | **369 bestanden / 2 skipped**, 0 fehlgeschlagen |
| pytest (Build-Tests) | `PYTHONIOENCODING=utf-8 python -m pytest tests/build -q` | **24/24 bestanden** |
| Build (Development) | `PYTHONIOENCODING=utf-8 python build.py` | **Exit 0** |
| Build (Production) | `PYTHONIOENCODING=utf-8 python build.py --production` | **Exit 0** |

`git status --porcelain features/ systems/ ui/ core/ render/ utils/ assets/styles/` nach dem
Abschlusslauf: leer — kein Produktionscode und kein CSS wurde in diesem Plan geaendert.

**Messblock 13 ist der letzte maschinelle Eintrag dieser Phase.** Die Vorlagenzahl steht ab jetzt
an jeder Fundstelle mit dem gemessenen Wert; der Waechter aus `tests/unit/docs-consistency.test.js`
deckt beide Zahlen desselben Fehlermodus (CSS-Dateizahl UND Vorlagenzahl) ab. Was dieser
Messblock NICHT erbringt und nicht erbringen kann: GATE-05 Stufe 3, die volle menschliche
Vier-Themes-Runde. Ihr Ergebnis steht — falls durchgefuehrt — woertlich in `15-14-SUMMARY.md`, nicht
hier; ein Messprotokoll fuehrt Zahlen und Exit-Codes, keine menschlichen Urteile.

---
*Phase: 15-befundlage-vorlauf*
*Plan: 08*
*Erhoben: 2026-09-09*
*Nachtrag Messblock 8: Plan 15-09, 2026-09-09*
*Nachtrag Messblock 9: Plan 15-10, 2026-09-09*
*Nachtrag Messblock 10: Plan 15-11, 2026-09-11*
*Nachtrag Messblock 11: Plan 15-12, 2026-09-11*
*Nachtrag Messblock 12: Plan 15-13, 2026-09-11*
*Nachtrag Messblock 13: Plan 15-14, 2026-09-12*
