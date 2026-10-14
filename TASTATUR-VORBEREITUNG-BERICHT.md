# Die Vorbereitungsansichten und E-2: Bericht

**Stand:** 14.10.2026, HEAD `328f123` auf Zweig `tastatur-vorbereitung` · **Ausgangsstand:** `b8a1a5c` (= `tastatur-strang` + das Zeitdach aus dem Schriften-Strang) · **22 Commits**, 17 Dateien, +6.000 Zeilen
**Anlass:** die 19 Ansichten, die du mit „Kampf zuerst" zurückgestellt hattest — und ein Befund, der beim Nachmessen auffiel

---

## 1 · Eine deiner Entscheidungen war nie geliefert

Du hattest im Tastatur-Paket vier Fragen beantwortet. Eine lautete **„Ein Halt je Gruppe, Pfeiltasten darin"** — E-2. Umgesetzt war sie nicht. Der Baum sagte es selbst, an zwei Stellen, ehrlich geschrieben:

> *„Nutzerendscheidung E-2 (ein Tabulatorhalt je Gruppe, darin Links/Rechts) ist NICHT umgesetzt und als Restschuld geführt. Heute hat jeder Punkt seinen eigenen Halt."*

**Und mein Bericht hat das verschwiegen.** In `TASTATUR-BERICHT.md` §7 Schritt 5 habe ich dich aufgefordert, genau diese Mechanik zu prüfen: *„ein Tabulatorhalt auf die Reihe, dann mit Links/Rechts darin laufen"*. Hättest du es versucht, hättest du nichts gefunden. In §6 „Offen" steht E-2 nicht. Der Agent hat die Schuld korrekt vermerkt; ich habe sie nicht in den Bericht getragen und stattdessen eine Nachkontrolle für ungebautes Verhalten aufgeschrieben.

Jetzt ist sie da:

| | 6 Kämpfer | 20 Kämpfer |
| --- | --- | --- |
| Zauberplatz-Punkte in der Ansicht | 42 | 140 |
| davon Tabulatorhalte | **6** | **20** |
| Halte, die in einem Behälter landen | 6 | 20 |

Genau ein Halt je Gruppe. Die Pfeilfahrt besucht alle sieben Punkte einer Reihe, `Pos1` auf den ersten, `Ende` auf den letzten, **kein Umlauf** am Rand — ein stiller Umlauf macht „bin ich am Ende?" unbeantwortbar. Die Achse ist **gemessen**, nicht behauptet: eine y-Linie, dx 101, dy 0. Das Nahbild zeigt den Fokusring auf dem **vierten** von sieben Punkten, eine Lage, die ohne Pfeiltasten nicht erreichbar war.

Die Ablichtung heißt jetzt `punktgruppe-zauberplaetze-pfeiltastenmodus.png`. Die Datei, die den alten Zustand im Namen trug, existiert nicht mehr.

---

## 2 · Die 19 Ansichten: 255 unerreichbare Stellen auf null

Auch hier war meine Vorgabe falsch. Im Tastatur-Bericht stand „145 der 462 Stellen"; gemessen waren es **255 in 12 von 19 Ansichten**, und sieben waren längst sauber. Die schlimmste: die Aufträge mit **60 von 108** Bedienelementen unerreichbar.

Jetzt, bei **6 und bei 20** Einträgen je Typ, über alle 24 Ansichten: **null unerreichbar.**

Und die Gegenprobe, die genauso zählt: **747 Mausziele über 14 Ansichten, Zahl für Zahl identisch** zum Ausgangsstand. Wer klickt statt tabuliert, merkt von dieser Arbeit nichts.

---

## 3 · Der eigentliche Fehler war keiner der Tastatur

Das Bestiarium hatte sechs **echte `<button>`** unerreichbar — etwas, das die `tabindex`-Nachrüstung nicht erklären kann, denn native Elemente überspringt sie ausdrücklich. Die Diagnose fand die Ursache, und sie liegt tiefer:

**`ui/virtual-scroll.js` ersetzt beim Scrollen alle Zeilen des Fensters per `innerHTML`.** Tabuliert man auf einen Knopf unterhalb des Fensters, scrollt der Browser den Behälter, der Lauscher feuert, der eben fokussierte Knoten wird gelöscht, `activeElement` fällt auf `BODY` — und der nächste Tabulator setzt *innerhalb* der frisch gebauten Zeilen wieder auf. Eine Endlosschleife. Was in der DOM-Reihenfolge **hinter** der Liste steht, wird nie erreicht; darum galten auch `qref-fab` und der Würfel-Auslöser dort als unerreichbar, obwohl sie korrekt nachgerüstet waren.

Es ist tempoabhängig, und das ist die Pointe:

| Pause je Anschlag | unerreichbar |
| --- | --- |
| 0 ms (Maschinentempo) | 17 |
| ab 30 ms | **27**, deterministisch |

Menschentempo liegt bei 250–600 ms. **Der Spielleiter trifft immer den schlechten Fall**; eine Messung ohne Pause unterschätzt die Schuld. Belegt mit zwei Ursachenproben: Scroll-Lauscher entfernt → 27 auf 17; virtuelles Scrollen ganz aus → alle 112 Favoritenknöpfe erreichbar. Und der Gegenbeweis über drei Ansichten: NSC erreicht die Schnell-Referenz in **37** Anschlägen, die Initiative in **196**, das Bestiarium in 220 **nicht** — gleiche globale Schale, gleiche 20 Zeilen. Der Unterschied ist das virtuelle Scrollen, und es hat im ganzen Baum genau einen Aufrufer.

---

## 4 · Wo ich im Auftrag falsch lag

Ich hatte geschrieben, E-2 heile das strukturell: ein Halt je Gruppe heißt die Liste einmal betreten und mit dem nächsten Tabulator verlassen, also kein Scrollen, also kein Neuzeichnen. **Gemessen kostete die Schnell-Referenz mit dem Zeilenhalt allein weiter 141 Anschläge, 133 davon auf Favoritenknöpfen.** Der Spielleiter musste durch jeden Knopf des SRD.

Es brauchte zwei echte Reparaturen und eine weitere Gruppe. Die interessantere steckt in `ui/virtual-scroll.js`: bei verschobenem Fenster wird der Fokus auf den frischen Knoten derselben Zeile übertragen — und zwar **in derselben Aufgabe**, weil `div.focus()` auf einem `div` ohne `tabindex` wirkungslos ist und die Fokussierbarkeit erst einen Bildwechsel später entsteht. Ein Bildwechsel mit `activeElement === BODY` ist eine Lücke, in die eine festgehaltene Pfeiltaste fällt.

Dazu ein Fehler im Code der ersten Einheit, der nur hier auffallen konnte: `_holeFokusZurueck()` rief `focus()` ohne `preventScroll` — nach 300 px Radrollen sprang die Liste auf `scrollTop 0` zurück. Im Kampfpaket unsichtbar, weil `renderInit()` nicht rollt.

Eine Entscheidung, die ich hervorheben will, weil sie zwei Systeme gegeneinander abwägt: der namenlose Markenbehälter der Aufträge trägt jetzt `data-tastgruppe`, ein **data**-Attribut statt einer Klasse. Begründung: der Stil-Sollstand schlüsselt Elemente als `tag.klassen#index` — eine Klasse hätte dort 20 neue Schlüssel erzeugt.

---

## 5 · Die Abnahme urteilte FEHLSCHLAG, an genau einer Stelle

Alles andere hielt auf die Stelle. Der Durchfaller: **`aria-expanded` folgte am Auftragskopf dem Zustand nicht.** Selbst nachgestellt:

| Familie | in Gruppe | `aria` vorher → nachher | Klasse danach |
| --- | --- | --- | --- |
| `toggle-quest` | ja | `false` → **`false`** | **offen** |
| `toggle-shop` | ja | `false` → `true` | offen |
| `toggle-collapse`, `toggle-wiki-category` | nein | `null` → `null` | — |

Genau ein Fall, nicht drei — die Gegenprüfung hatte „3 der 4 Familien" gemeldet, die Abnahme nur `toggle-quest`, und die Abnahme hatte recht.

Ursache: `toggleQuest()` schaltet **nur eine Klasse** um. Keine `childList`-Änderung, kein `save()` — der Beobachter von `KeyboardGroup` horchte nur auf `childList`, also lief die Zustandsregelung nie. Das Vorleseprogramm hörte „eingeklappt", während der Auftrag offen stand. **Gegen den Ausgangsstand ist das eine Verschlechterung**: vorher trug der Kopf gar kein `aria-expanded`, das Hilfsmittel schwieg. Eine Falschaussage ist schlechter als Schweigen.

Abhilfe am allgemeinen Ort, nicht in `toggleQuest()`: der Beobachter horcht zusätzlich auf `attributeFilter: ['class']`. Dass sich das nicht selbst auslöst, ist nachgemessen — das Modul schreibt nirgends eine Klasse. Nebenbefund, der mit abgedeckt ist: `toggleCollapse()` erzeugte seine `childList`-Änderung nur **beiläufig**, durch das Umschreiben des Pfeil-Icons. Wer das Icon entfernt, hätte dort denselben stillen Fehler gehabt.

Und der Wächter war tautologisch: die bestehenden Fälle lesen den Zustand **einmal**, direkt nach dem Öffnen, und prüfen eine Anzahl — damit belegen sie die Anwesenheit des Attributs, nie seine Richtigkeit. Neu ist Fall **(18g)**: er bedient zuerst und liest danach, auf Maus- **und** Tastaturweg (26 echte Tabulatorsprünge, dann `Enter`). Mutationsbeweis: Beobachter zurück auf `childList` allein → **2 failed / 1 passed**; rot werden die Auftragsfälle, grün bleibt `shops`, das neu zeichnet. Genau die Trennschärfe, die gefehlt hat.

---

## 6 · Alle Tore, von mir unabhängig nachgefahren

| | Ausgangsstand `b8a1a5c` | jetzt `328f123` |
| --- | --- | --- |
| Jest | 2.250 (81 Suiten) | **2.264 (82 Suiten)** |
| Playwright | 728 / 47 / 0 | **876 / 47 / 0, exit 0** (15,4 min) |
| pytest | 30 | **30**; frischer Baum ohne `dist/` 25 + 5 |
| Lint | 363, exit 0 | **363 Probleme, 0 Fehler, exit 0** |
| Typecheck + strict | grün | **0 / 0** |
| Builds dev + prod | grün | **beide 0** |
| Dubletten / `!important` / Inline | 0 / 104 / 251 | **unverändert** |
| Stil-Sollstand | — | **3.615 Schlüssel, 0 geändert / 0 Zugänge / 0 Abgänge** |

**Eine Zahl geht nicht auf, und ich kann sie nicht erklären:** Playwright sammelt 924 Fälle, mein Lauf meldet 876 bestanden + 47 übersprungen = 923. Null Fehlschläge, exit 0, kein „flaky", keine Unterbrechung. Der `line`-Reporter überschreibt seine Fortschrittszeile, die Aufzeichnung enthält die Testnamen also nicht — welcher Fall in der Rechnung fehlt, lässt sich daraus nicht bestimmen.

**Der verbotene Rand ist leer**, nachgezählt: `CLAUDE.md`, der Stil-Sollstand, `core/constants.js`, der Leisten-Generator, die Templates und die Berichte haben **null** Zeilen im Diff.

**Die Gegenrichtung ist belegt.** Mit stillgelegter Gruppenmechanik: **65 failed / 94 passed** — darunter ausdrücklich die drei Maus-Gegenproben. Ein Befund dabei, der in die Akte gehört: **beide Jest-Dateien bleiben dabei grün** (44/44). Die Einheitsebene prüft die Anmeldedaten, nicht das Verhalten; das fängt erst die E2E-Ebene, dort aber massiv.

---

## 7 · Offen

1. **Die App-eigene Tastenhilfe nennt die neuen Tasten nicht** — und das ist der gewichtigste Posten. E-2 führt Pfeiltasten, `Pos1` und `Ende` ein, und ein sehender Tastaturnutzer hat **keinen** Weg, davon zu erfahren: er tabuliert auf einen von sieben Punkten und sieht sechs tote Nachbarn. Für die Taste `H` hat der Vorgänger-Strang eine Zeile ins Overlay geschrieben — der Präzedenzfall steht. Die Datei lag auf meiner Verbotsliste, die Arbeit **konnte** es nicht tun.
2. **`CLAUDE.md`** hat keine Zeile für `←/→`, `↑/↓`, `Pos1`/`Ende` innerhalb einer Gruppe. Richtig nicht angefasst — sag Bescheid, dann liefere ich beide Zeilen in einem Commit.
3. **77 bzw. 97 verschachtelte `role="button"`** (zwei Metriken, kein Widerspruch). Eine ARIA-Autorenverletzung, in Chromium ohne gemessene Wirkung; geratscht, nicht repariert. Größte verbliebene Restschuld.
4. **`docs/bugfixes.md`** ist seit dem 28.09. unverändert, obwohl `CLAUDE.md` einen Eintrag je Bugfix verlangt und dieser Strang zwei echte enthält (Fokusverlust im virtuellen Scrollen, fehlendes `preventScroll`).
5. **Kosmetik:** ein Kommentar in `tests/build/test_build_deduplication.py` nennt „18 Gruppenarten" — es sind 22.
6. **Nicht gepusht.** Vier Zweige liegen jetzt lokal bzw. offen: `uat-funde-und-mobil-layout` (PR #3), `design-welle-4` (PR #4), `tastatur-strang`, `schriftdateien`, `tastatur-vorbereitung`.

---

## 8 · Nachkontrolle

Diesmal eine, die wirklich existiert — ich habe vor dem Schreiben geprüft, dass jedes verlangte Verhalten im Baum steht:

1. **Initiative, Zauberplätze.** Mit Tab auf eine Punktreihe. Es ist **ein** Halt, nicht sieben. Dann **Links/Rechts** darin laufen, mit der Leertaste schalten, `Pos1` und `Ende` probieren. Am letzten Punkt noch einmal `→`: es soll **stehenbleiben**, nicht umlaufen.
2. **Bestiarium.** Nur mit Tab vom Kopf der Seite bis zum Schnell-Referenz-Knopf unten links. Das war vorher **unmöglich** — der Lauf versackte in der Monsterliste. Dann in der Liste mit ↑/↓ scrollen und darauf achten, ob die Liste **unter der Hand zurückspringt** (das war der `preventScroll`-Fehler).
3. **Aufträge.** Einen Auftragskopf ertabulieren, `Enter`, aufklappen — und dann mit Tab weiter. Vorher waren 60 von 108 Stellen dieser Ansicht gar nicht erreichbar.
4. **Eine Filterleiste** (NSC, Beute oder Zauber): ein Halt hinein, Pfeiltasten durch die Marken, **ein Tab heraus**. Nicht im Kreis.
5. **Und die Gegenprobe: mit der Maus ändert sich nichts.** 747 Ziele sind zahlengleich gemessen — wenn dir trotzdem etwas unter dem Finger wegrutscht, ist das ein Befund.
