# Design-Handoff v3 — Welle 6 (Fokus & Eingaben): Bericht und Sichtungsliste

**Stand:** 07.10.2026, HEAD `a986489` auf Zweig `design-welle-4` · **Ausgangsstand:** `e4ac3a7` · **16 Commits**, 29 Dateien, +6.546 / −363
**Grundlage:** `HANDOFF-v3/DESIGN-HANDOFF-v3.md` §5 Welle 6 — **die letzte Welle des Handoffs**

---

## 1 · Was diese Welle besonders macht

Sie ist die **einzige des ganzen Handoffs, die Verhalten ändert**. Alle fünf Vorwellen haben Farben, Abstände, Bewegung und Schrift verschoben — hier geht es darum, ob du **siehst, wo du bist**, wenn du mit der Tastatur arbeitest.

Und genau dafür gab es **null Testdeckung**. Der versionierte Stil-Sollstand hasht zwölf berechnete Eigenschaften je Element; `outline` ist in keiner Schreibweise darunter (ich habe es am Werkzeug abgefragt, nicht abgeschrieben), und der Abzug entsteht ohnehin im **unfokussierten** Ruhezustand. Darum stehen vor jeder geänderten Zeile **elf Ratschen**, jede zuerst rot und beziffert.

---

## 2 · Die Hauptabnahme in einer Tabelle

24 Ansichten + 3 Aufklapp-Formulare + 6 Modale, gefüllte Kampagne, **echte Tabulatorsprünge** (nie `.focus()` — darauf springt `:focus-visible` nicht an), vier Themes. Links das Bündel aus `e4ac3a7`, rechts der Wellenstand, **dasselbe Skript für beide Spalten**.

| Theme | sichtbare Halte | **ohne Fokuskennzeichen** | Ring unter 3:1 | schlechtestes Verhältnis |
| --- | --- | --- | --- | --- |
| dark | 1298 → 1301 | **194 → 0** | 0 → 0 | 7,29 → 7,29 |
| light | 1180 → 1180 | **120 → 0** | **333 → 0** | **2,64 → 3,86** |
| sepia | 1155 → 1180 | **119 → 0** | 0 → 0 | **5,09 → 3,44** |
| contrast | 1180 → 1175 | **119 → 0** | 0 → 0 | 11,34 → 11,34 |

**552 sichtbare Tastaturhalte ohne jedes Fokuskennzeichen sind 0 geworden.** Jeder sichtbare Halt trägt danach einen Ring, und jeder dieser Ringe hält die 3:1 von WCAG 1.4.11 gegen die Fläche, die er wirklich berührt — geschichtet gerechnet, weil `outline-offset: 2px` den Ring *außerhalb* des Elements legt.

Der Ring ist danach **eine Farbe und ein Maß je Theme**, über alle 1175 bis 1301 Halte hinweg, ohne eine einzige Abweichung.

Bei **375 px** dasselbe Bild: 1542 bis 1626 sichtbare Halte je Theme, **0 ohne Ring, 0 unter 3:1**, kein seitlicher Überhang.

---

## 3 · Drei Dinge, die der Handoff falsch hatte

**Das Rezept hätte das Gegenteil bewirkt.** Der Handoff wollte die 31 `outline: none`-Regeln auf `:focus:not(:focus-visible)` umschreiben, damit der Ring beim *Klicken* ausbleibt. Gemessen: Chromium setzt `:focus-visible` bei Textfeldern und `select` **auch beim Mausklick** — und alle 31 Unterdrücker saßen auf genau solchen Eingaben. Das Rezept hätte sein Ziel an **keiner** seiner Stellen erreicht und dabei an 29 Regeln das damals *einzige* Kennzeichen entfernt. Umgesetzt ist stattdessen: die Zeile `outline: none` fällt, der goldene bzw. cyane Fokus**rahmen** bleibt. Jedes Feld zeigt jetzt beides.

**Eine Teilaufgabe hatte keinen Gegenstand.** „`border-radius` aus der globalen `:focus-visible`-Regel streichen" — die Regel hat nie ein `border-radius` getragen. Zwei Deklarationen, damals wie heute. Der Anspruch stammt aus einem v2-Patch, der nie eingebaut wurde. Das steht jetzt als Kommentar an der Regel, damit niemand ein drittes Mal danach sucht.

**Vier tote Anker in einer Welle mit vier Punkten.** `party.css:1485` ist in Wahrheit 1371 — und 1485 trägt heute eine *andere* Eingaberegel, der falsche Anker führt also an die falsche Stelle, nicht ins Leere. `core.css:1965` ist 2172. Diese Welle musste in zwei Einheiten **178 Zeilenanker** nachziehen.

---

## 4 · Das zentrale technische Problem — und warum es nicht umgangen wurde

Der Handoff führt „Ring setzen" und „Eingaberahmen aufhellen" als zwei unabhängige Nummern. Sie sind es nicht: **29 der 31 Fokusregeln hatten als einziges Kennzeichen einen Rahmen*farb*wechsel.** Hellt man den Ruherahmen auf, bricht dieser Wechsel ein — gemessen 5,41 → 1,98 in Dark.

Alle drei denkbaren Wege sind durchgerechnet (eigener Fokuswert, selektive Anwendung, Wechsel durch Dicke). Gewählt ist der erste, **mit dem Token, das der Ring schon trägt**, weil WCAG 1.4.11 die Schwelle an den **Raum** legt und nicht an die **Zeit**: die Norm vergleicht benachbarte Farben, nicht einen Zustand mit seinem eigenen Vorzustand.

Dabei kam zweierlei heraus, das niemand benannt hatte:

- Der Fokus**rahmen** hielt seine 3:1 vorher in **zwei von vier Themes nicht** (`--gold` in Light 2,98, `--cyan` in Sepia 2,93).
- In Light und Sepia zeigte **jedes fokussierte Feld zwei verschiedene Goldtöne, 2 px voneinander entfernt** — Ring und Rahmen aus unterschiedlichen Tokens. 0 von 219 gleich, jetzt 146 von 146.

Beim Ruherahmen: **163 bis 164 von 194 sichtbaren Feldern je Theme** lagen unter 3:1, jetzt 0 — bis auf eine namentlich geduldete Zelle (`#char-hp-temp`, Sepia, 2,93, bedeutungstragendes Cyan).

---

## 5 · Sepia hat etwas abgegeben, und das soll hier stehen

Sepias schlechtestes Ringverhältnis fällt von **5,09 auf 3,44**. Das ist kein Mangel, sondern der Preis der Token-Entscheidung: der alte Sattelbraun-Ring hielt mühelos auf den hellen Sepia-Flächen und fiel auf der dunklen, themenblinden Modalfläche auf **2,37**. Der neue hält auf *beiden*, mit 15 % Puffer statt mit 70 % auf der einen und einem Durchfall auf der anderen.

Und die 3,50 sind eine **Decke, keine Wahl**: wer gleichzeitig gegen die hellste Seitenfläche und gegen die dunkle Modalfläche ≥ 3 halten muss, kann das Minimum höchstens dorthin schieben, wo beide gleich groß sind. Über das ganze Goldband in Einerschritten nachgesucht — mehr geht nicht, solange der Ring **ein** Wert je Theme ist.

---

## 6 · Die zwei Zähler: ein Fehler, der im Normalbetrieb immer auftrat

Der Zähler in der Werkzeugleiste der Zauber- und der Auftragsansicht stand **dauerhaft auf 0**, egal wie viele Einträge im Bestand lagen. Grund: nur `renderAll()` schrieb ihn, und das läuft ausschließlich beim Import, beim Zurücknehmen und beim Wiederherstellen — nicht bei einer einzigen CRUD.

Mit echten Daten nachgemessen, **ausschließlich** über `renderSpells()` / `renderQuests()`:

| Handgriff | vorher | nachher |
| --- | --- | --- |
| 5 Zauber | `0` | **`5`** |
| auf 2 gekürzt | `0` | **`2`** |
| geleert | `0` | **`0`** |
| 3 Aufträge | `0` | **`3`** |
| auf 1 gekürzt | `0` | **`1`** |
| geleert | `0` | **`0`** |

Die Filterrückmeldung darunter behält ihre eigene Aussage und heißt jetzt anders: ohne Filter `📖 5`, mit Stufenmarke 1 `📖 2/5`, mit Suchtext `📖 1/5`. Zwei Dinge, zwei Namen.

**Eine Messfalle, die ich selbst gestellt habe** und die darum in der Akte steht: mein erster Abnahmelauf setzte `select#spell-level-filter` — ein Element, das es nicht gibt (der Stufenfilter ist eine Markenleiste). Ein Zugriff auf ein nicht vorhandenes Element wirft nicht, er tut nichts, und das sah aus wie „die n/N-Form ist weg". Über den echten Bedienweg stimmt alles.

---

## 7 · Alle Tore, von mir unabhängig nachgefahren

| | Basis (`e4ac3a7`) | jetzt (`a986489`) |
| --- | --- | --- |
| Jest | 2.110 (78 Suiten) | **2.137 (78 Suiten)** |
| Playwright | 604 / 31 / 0 | **634 / 39 / 0** |
| pytest | 30 | **30** |
| Lint | exit 0, 363 Warnungen | **exit 0, 363 = Pin** |
| Typecheck / strict | grün | **grün** |
| Builds dev / prod | exit 0 | **exit 0** |
| DUBLETTEN / `!important` / Inline | 0 / 104 / 252 | **0 / 104 / 251** (eine gesunken) |
| `outline: none` | 31 Deklarationen | **1** |
| drei Wächter | OK | **OK** (Anker 123/0, Leisten 22/22, F-18 117/117) |
| CLAUDE.md | — | **unverändert** |

**Die +27 Jest-Fälle** liegen vollständig in `design-consistency.test.js` (292 → 319); keine andere Unit-Datei ist angefasst. **Die +38 Playwright-Fälle** sind 34 Ratschen (fokusring 7+4, eingaberahmen 12, zaehler 11) und 4 übersprungene Ablichtungen.

**Die zwei bekannten Toast-Wackler** sind in **beiden** vollen Läufen dieser Abnahme nicht aufgetreten. Sie bleiben als vorbestehend geführt, nicht geheilt.

**Der Stil-Sollstand, schlüsselweise:** 96 bewegte Digests, 3 Zugänge, 0 Abgänge. **96 von 96 allein durch `borderColor` erklärt**, 0 unerklärt. Die drei Zugänge sind *ein* Element und ein Nebenbefund mit Wert: der Erheber nimmt nur Elemente mit mindestens einer Klasse auf — die Filterrückmeldung hatte vorher nur eine ID und vier Inline-Deklarationen und war für den einzigen Bildwächter des Projekts **unsichtbar**. Jetzt steht sie zum ersten Mal unter seiner Aufsicht.

**Linux-Nachstellung** (die CI läuft auf ubuntu-latest): der volle Tastaturlauf unter breiter Schrift (Faktor 1,155, belegt) liefert die vier Minima **auf die dritte Stelle gleich**. Ring und Rahmen sind metrikfrei — jetzt gemessen statt behauptet. Die einzige metrikabhängige Stelle der Welle, die umbenannte Filterrückmeldung, hält bei 1600 und bei 375 px ihre 10 px vom rechten Innenrand, Überhang 0.

---

## 8 · Sichtungsliste

**376 Bilder** in `tests/e2e/__screens__/welle-6/` (94 je Theme: 24 Ruhebilder, 24 Bilder **mit wirklich ertabuliertem Feld**, 24 Naheinstellungen, 13 Zustandsbilder), dazu ein **Kontaktbogen mit 13 Vorher/Nachher-Paaren** in `tests/e2e/__screens__/welle-6/vorher-nachher/kontaktbogen-welle-6.png`.

Neu erzeugen:

```bash
python build.py && WELLE6_SCREENS=1 npx playwright test tests/e2e/features/welle-6-screens.spec.js
```

Reihenfolge der Sichtung: **erst Light** (dort ändert die Welle am meisten), dann Sepia in den Modalen, dann Contrast, zuletzt Dark.

1. **Der Ring im hellen Theme.** `#946c09` statt `#b8860b`. Rechnerisch dasselbe Gold (Farbwinkel 42,73 gegen 42,66 Grad), nur dunkler. **Liest es sich auch so?** → Paar `a`
2. **Die 26 Felder, die den Ring neu bekommen** — alle Suchfelder, Filterwähler, Initiativ-Eingaben, Würfelausdruck, DM-Notizfeld, Bestiariums- und Kalenderfilter. **Stört der Ring beim Klick in ein Suchfeld?** → Paar `b`, `suchfeld-fokus-*.png`
3. **Der Rahmenwechsel an den 29 Regeln — ist er noch da?** Gemessen ja, alle 25 Rahmenzeilen stehen. **Rahmen UND Ring zugleich: zu viel?** → Paar `d`
4. **Die ~300 aufgehellten Ruherahmen.** `#cccccc` → `#767676` in Light. **Wirken die Formulare noch ruhig?** → Paare `e` und `f`
5. **Sepia im Modal** — die Stelle, die die ganze Token-Entscheidung ausgelöst hat. → Paar `j`
6. **Die zwei Zähler.** Die Pille zeigt zum ersten Mal eine Zahl. **Zwei Zahlen in einer Ansicht — verwirrt das?** → Paare `g` und `h`
7. **Ein Tabulaturlauf durch eine Ansichtsreihe: verschwindet der Fokus noch irgendwo?** → die 24 `*-fokus-<theme>.png`
8. **Die geduldete Ausnahme** `#char-hp-temp` mit 2,93 in Sepia. **Ist die Bedeutung die 0,07 wert?** → Paar `l`
9. **Contrast als Gegenprobe** — Ringfarbe unverändert. **Sieht man überhaupt, dass sich etwas geändert hat?** Wenn nein, ist das richtig so. → Paar `k`
10. **375 px.** **Ist der 2-px-Ring mit 2 px Abstand auf dem Telefon zu dick?** → Paar `m`, `mobil-*.png`

---

## 9 · Nach dem Handoff — die Übergabe

Mit dieser Welle ist der Handoff **abgearbeitet**. Das Design-System ist damit nicht fertig. Die vollständige Liste steht in `.planning/HANDOFF-V3-OFFENE-PUNKTE.md` unter „NACH DEM HANDOFF"; hier das Gerüst:

1. **Der Tastatur-Strang** — der größte Posten, und er war nie Teil einer Designwelle. **84** sichtbare, bedienbare Elemente ohne Tastaturzugang; **35** Modale ohne `role="dialog"` und ohne Fokusfalle (im Lebenspunkte-Rechner verlassen 15 von 25 Schritten das Modal); **188** von 413 Marken ohne Bindung; **57–58** verbleibende Phantom-Halte je Theme in drei Gruppen. **Wichtig:** ein `tabindex` allein genügt nicht — die Ereignisverteilung hört nur auf `click`, `change` und `input`.
2. **Die §7-Ausnahmen** — nur zwei von acht tragen den geforderten Kommentar. Entweder ein eigener Durchgang oder die Regel für diese Familien ausdrücklich aufheben.
3. **Die Restschulden der sechs Wellen**, einzeln geführt: von den fünf JS-Stellen der Welle 1 über die zehn kaputten `woff2` und den `file://`-Pfad der Schriften (Welle 5) bis zur Decke von 3,50 beim Ring (Welle 6).
4. **GATE-04** — `tools/sync-editor-toolbars.js --check` existiert als Fähigkeit, aber nichts fährt ihn automatisch. 22/22 sind synchron; nichts hält sie so.
5. **149 Hex-Farbliterale außerhalb CSS**, von keinem Requirement gedeckt.
6. **`npx prettier --check` ist projektweit rot, an jedem Stand.** Formatierung ist von keinem Tor gedeckt; `npm run format` bleibt gesperrt.
7. **Nichts ist gepusht.** Die Wellen 1 bis 6 liegen als lokale Commits auf `design-welle-4`.

---

## 10 · Der ganze Handoff in Zahlen

**297 Commits** seit Beginn dieser Sitzung, 146 Dateien, +51.001 / −4.004 Zeilen — Welle 3 (Schatten), die vier UAT-Funde, der F-18-Durchgang, das Mobil-Layout, die Linux-Korrekturen und die Wellen 4, 5 und 6.

| | am Anfang (`03274fa`) | jetzt (`a986489`) |
| --- | --- | --- |
| Jest | 1.786 (71 Suiten) | **2.137 (78 Suiten)** |
| Playwright | 381 / 11 übersprungen | **634 / 39 / 0 Fehlschläge** |
| pytest | 30 | 30 |
| Lint | 363 = Pin | 363 = Pin — **nie angehoben** |
| DUBLETTEN | 0 | 0 |
| `!important` | 105 | **104** |
| Inline-Stile | 256 | **251** |
| `transition: all` | 134 | **0** |
| `outline: none` | 31 | **1** |
| verschiedene `box-shadow`-Werte | 55 | **28** |
| Schriftgrößen auf der Skala | 63,4 % der Elemente | **98,1 %** |
| Tastaturhalte ohne Fokuskennzeichen | 552 | **0** |

**Keine Ratsche ist je gestiegen. Fünf sind gesunken.**

Jede dieser Zahlen ist von mir unabhängig nachgemessen, nicht aus Agentenberichten übernommen.
