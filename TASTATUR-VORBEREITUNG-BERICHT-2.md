# Tastenhilfe und Mobil-Kopf: Bericht

**Stand:** 20.10.2026, HEAD `a2699a0` auf Zweig `tastatur-vorbereitung` · **Ausgangsstand des Strangs:** `4e0d810` · **119 Commits**, 54 Dateien, +25.993 / −135
**Anlass:** der gewichtigste offene Posten des letzten Pakets — *„die App-eigene Tastenhilfe nennt die neuen Tasten nicht"*

---

## 1 · Was dieses Paket geworden ist

Angefangen hat es mit zwei Zeilen, die ich dir angeboten hatte: die E-2-Tasten in die Tastenhilfe und in die Kürzeltabelle. Beim Nachmessen war die Hilfe **weit mehr als um E-2 überholt** — sie nannte 25 von 48 belegten Tasten. Daraus wurde ein Wächter, der Drift rot stellt, und aus dem Wächter fielen **vier echte Fehler**, die niemand gemeldet hatte:

| Fehler | Wirkung für dich |
| --- | --- |
| `Strg+Shift+Z` war ein **toter Zweig** | Wiederholen über diese Taste tat nichts — die Bedingung las `e.key === 'z' && e.shiftKey`, der Browser liefert mit Shift aber `'Z'` |
| `Strg+P` hatte **keine Modifikatorschranke** | fraß den Druckbefehl des Browsers und schaltete den Zug weiter |
| `Alt+Shift+6` und `Alt+Shift+8` | fielen durch die Soundboard-Familie in die Würfelfamilie und **würfelten** |
| `Entf`/`Backspace` im Netzwerk | **tot seit die Tabelle geschrieben wurde**: der Zweig prüft `#view-network.active`, die Ansicht heißt `view-links` |

Dann kam der Mobil-Kopf dazu, weil die Hilfe auf dem Telefon **nicht zu öffnen** war. Und dabei zeigte sich, dass das kein Problem der Hilfe allein ist.

---

## 2 · Die Tastenhilfe sagt jetzt, was die App kann

**25 Tasten in 25 Zeilen → 47 Token in 40 Zeilen, sechs Abschnitte.** Gemessen sind **48 belegte** Tasten in vier Messlagen: 18 Einzeltasten in der Initiative, 24 Modifikatorkombinationen, die Leertaste, und die sechs E-2-Tasten auf einem Gruppenglied.

Die Messung ist **gerechnet, nicht getippt**: das vollständige Kreuzprodukt der acht Einzeltasten-Kürzel mit vier Modifikatorlagen, dazu beide Ziffernfamilien über alle zehn Ziffern. Eine handverlesene Liste von 46 Kombinationen hatte **sechzehn belegte übersehen**.

Vier Tasten sind **bewusst nicht** nachgetragen, auf gezählter Ausnahmeliste: sie tun etwas, aber etwas Falsches. In die Hilfe geschrieben wären das Zusagen.

**Und der Wächter hat Zähne:** ein Kürzel im Code ohne Zeile in der Hilfe wird rot; eine Zeile für eine Taste, die nichts tut, wird rot. Er liest die Hilfe aus dem **gebauten Bündel** — nicht aus der Vorlage und nicht aus `CLAUDE.md`.

---

## 3 · Der Mobil-Kopf: von drei auf sieben

`[data-layout="mobile"] .header-actions { display: none }` blendet die **ganze** Knopfreihe aus, und das Layoutprofil folgt dem Fenster. Gemessen:

| Fenster | bedienbare Kopfzeilen-Knöpfe |
| --- | --- |
| 1440 / 1200 px | 7 von 7 |
| **900 px** | **4 von 7** — drei liegen außerhalb des Fensters |
| 680 / 390 / 360 / 320 px | **0 von 7** |

**Kopfzeilen-Aktionen in höchstens zwei Griffen: 3 von 7 → 7 von 7** bei 390/360/320 px. Auf dem Schreibtisch unverändert.

Der ⋯-Knopf ist **26 × 43 px** — die Breite des schmalsten Nachbarn, nicht die 35,5 der übrigen, denn die passten nicht. Bezahlt aus drei **toten** Zwischenräumen im bestehenden 600-px-Block; **keine Tippfläche geschrumpft**, die 43-px-Tipphöhe unberührt, keine vierte Mediengrenze. Bleiben 15,3 px Luft bei 320 px gegen eine Schranke von 12.

Das Beste daran: ein **achter** Kopfzeilen-Knopf erscheint automatisch im Menü *und* wird automatisch mitgeprüft — die Einträge entstehen zur Laufzeit aus `.header-actions`. Damit ist eine Restschuld der Mobil-Runde an dieser Stelle geschlossen.

---

## 4 · Zwei Befunde, die ich selbst nachgetragen habe

Die Abnahme urteilte **FEHLSCHLAG**. Die zwei gewichtigsten Gründe habe ich behoben.

**Das Ereignislog schluckte Tipps auf Menü-Einträge.** `.event-log` liegt auf `z-index 4000` und setzt im Dauermodus (`L`, in der Hilfe beworben) `pointer-events: auto` auf seinen Einträgen; das Menü liegt auf 300:

| Fenster | vorher verdeckt | nachher |
| --- | --- | --- |
| 390×844 | 1 von 7 | **0** |
| 480×320 | 5 von 7 | **0** |
| 320×480 | 6 von 7 | **0** |

Ein voll sichtbarer Eintrag tat also nichts — und **kein Fall sah es, weil keine der acht Wächtergrößen `L` drückt**, obwohl der Baum diese Gefahrenklasse längst katalogisiert hat (`variables.css`, M1: *„#event-log z=4000, Deckung 71420 px²"*, Heilmittel *„verstecken, nicht ausweichen"*). Abhilfe wie bei der Tastenhilfe: eine Marke auf `<body>`, das Log tritt beiseite. Keine Ausnahme in der z-Leiter. Mutationsbeweis: Regel entfernt → **3 von 3 rot**.

**Die Hauptaussage war hohl.** Fall (1) war mit **vollständig gelöschtem Menü** an allen drei Telefonbreiten grün: er fragt „direkt bedienbar *oder* über irgendeinen Öffner", und der Layout-Umschalter ist so ein Öffner, der auf `desktop` kippt. Neu ist Fall (19): mit offenem Menü muss **jede** Aktion als Eintrag darin stehen, sichtbar und treffbar, an sechs Maßen. Menü gelöscht → rot.

---

## 5 · Alle Tore, von mir unabhängig nachgefahren

| | Ausgangsstand `4e0d810` | jetzt `a2699a0` |
| --- | --- | --- |
| Jest | 2.137 (78 Suiten) | **2.283 (84 Suiten)** |
| Playwright | 629 bestanden / 5 Fehlschläge | **986 gesammelt = 939 + 47 übersprungen + 0, exit 0** |
| pytest | 30 | **30** |
| Lint | 363, exit 0 | **363 Probleme, 0 Fehler, exit 0** |
| Typecheck + strict | grün | **0 / 0** |
| Builds dev + prod | grün | **beide 0** |
| Stil-Sollstand | — | **0 geänderte Digests** |
| Flockigkeit | — | **dreimal identisch, null** |

Die Rechnung geht exakt auf: 939 + 47 = 986. **Der verbotene Rand ist leer** — Sollstand-Datei, `core/constants.js` und der Leisten-Generator haben null Zeilen im Diff.

---

## 6 · Ein Fehler in meinem Vorgehen, nicht in der Arbeit

Vier Abnahmen in Folge haben bemängelt, dass Befunde aus der **zweiten** Prüfrunde unbehoben blieben. Das ist kein Agentenversagen. Die Schleife, die ich geschrieben habe, prüft — repariert — prüft erneut — und **endet dann**. Die Befunde der zweiten Prüfung werden gesammelt, berichtet und nie repariert. **Drei Arbeitsrunden hatten diese Form.**

Deshalb wuchsen die offenen Posten schneller, als sie abgearbeitet wurden, und deshalb las sich jede Abnahme wie ein Rückschritt, obwohl die Kernarbeit trug. Die Abnahme hat es ausgesprochen: *„Der Reparaturbericht adressiert ausschließlich Runde 1."*

Dazu drei eigene Zahlenfehler dieser Runde: meine „drei fehlenden Aktionen" waren **vier**; „64 px frei bei 320 px" waren **28,3** (ich hatte Innenabstände und Zwischenräume nicht mitgezählt); und „ein 35-px-Knopf passt mit 29 px Luft" war **5,8 px**, unter dem Boden. Und die Zahl „3.831" für die Blattschlüssel des Sollstands, die ich zweimal weitergegeben habe, trifft unter **keiner** von fünf gemessenen Lesarten etwas (3978 / 3759 / 3615 / 7374 / 986).

---

## 7 · Offen: dreizehn Befunde, vier davon gewichtig

1. **`Strg+Shift+Y` löst Wiederholen aus** — neu entstanden durch die CapsLock-Normalisierung, ohne Zeile in der Hilfe, außerhalb der gemessenen Menge. Widerspricht der Zusage in `CLAUDE.md`, der belegte Tastensatz sei unverändert.
2. **`Strg+Shift+T` ist bei CapsLock tot**, obwohl die App es selbst bewirbt (`Strg+⇧+T`, „Tabelle"). `rich-text-insert.js:273` vergleicht `e.key === 'T'`. Die Zusage *„Every letter comparison goes through `TASTE(e)`"* in `CLAUDE.md` gilt also nicht.
3. **Der Schließknopf des Impressums** ist 19,7 × 20 px, hat keinen Namen, und ein Tipp auf den Hintergrund schließt nicht.
4. **Nach Escape aus der Tastenhilfe** hängt der Fokus auf einem unsichtbaren Knoten statt auf dem Öffner — die Escape-Zeile verspricht das Gegenteil.

Dazu neun kleinere: ein Tabulatordruck lässt das Menü offen stehen, `n` wird in zwei Ansichten verschluckt, der lokale E2E-Lauf baut das Bündel nicht neu, der Stil-Sollstand ist für die Kopfzeile strukturell blind, die 900-px-Lücke und ihr Preis bei 1200 px haben keinen Fall, und vier Zahlen in Akten und Kommentaren stimmen nicht.

**Nicht gepusht.** Fünf Zweige liegen lokal bzw. offen: `uat-funde-und-mobil-layout` (PR #3), `design-welle-4` (PR #4), `tastatur-strang`, `schriftdateien`, `tastatur-vorbereitung`.

---

## 8 · Nachkontrolle

Vor dem Schreiben geprüft, dass jeder Handgriff im Baum existiert:

1. **Telefon, ⋯-Knopf oben rechts.** Sieben Einträge. **Wiederholen** und **Impressum** hattest du dort noch nie — die gab es auf dem Telefon nicht.
2. **Dann `L` drücken** (Dauermodus des Logs), ein paar Hinweise erzeugen, das Menü erneut öffnen und einen Eintrag antippen. Das war der blockierende Fehler: der Tipp landete im Log.
3. **Tastenhilfe öffnen** (im Menü oder mit `?`). Nimm drei Zeilen und probiere sie aus. Sie sollte jetzt sagen, was die App kann — **und `/` muss die Schnellreferenz öffnen**, nicht die Hilfe. Das war auf deutscher Tastatur verkehrt.
4. **Escape in der Schnellreferenz.** Sie schließt jetzt; vorher fragte der Zweig nach einer Klasse, die niemand setzt.
5. **Und die Gegenprobe:** auf dem Schreibtisch darf sich nichts geändert haben — sieben Knöpfe in der Kopfzeile, kein ⋯.
