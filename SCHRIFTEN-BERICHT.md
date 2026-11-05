# Die Schriftdateien: Bericht

**Stand:** 14.10.2026, HEAD `e4f3c72` auf Zweig `schriftdateien` · **Ausgangsstand:** `4e0d810` · **50 Commits**, 29 Dateien, +6.638 / −184
**Anlass:** der Posten, den du in Welle 5 mit „Dateien separat reparieren" beiseitegelegt hattest

---

## 1 · Der Befund war schlimmer als sein Einzeiler

Auf meiner Restliste stand „zehn `woff2` mit dem falschen Zeichensubset". Gemessen mit einem eigenen woff2-Leser (Brotli entpacken, cmap auflösen):

| Familie | Dateien | Was wirklich drinstand | fehlende deutsche Zeichen |
| --- | --- | --- | --- |
| Inter | 3 | **148 kyrillische** Glyphen | 97 von 100 |
| Poppins | 3 | **94 Devanagari**-Glyphen | 99 von 100 |
| Roboto | 2 | **155 kyrillische** Glyphen | 99 von 100 |
| Source Sans Pro | 2 | **56 kyrillische** Glyphen | 97 von 100 |

Keine Datei trug ein kleines `a`, keinen Umlaut, kein Eszett. Roboto und Poppins kannten auch das große `A` nicht.

Die Ursache ist mechanisch und wiederholbar: Googles CSS-Antwort ordnet die Blöcke `cyrillic-ext, cyrillic, greek-ext, greek, vietnamese, latin-ext, latin` — **`latin` steht zuletzt**, bei Poppins steht `devanagari` **zuerst**. Wer nicht den ganzen Block liest, greift verlässlich daneben.

**Und sie waren es von Geburt an.** `git log -- assets/fonts/` zeigt genau einen Commit: `1c3245b` vom 12.06.2026. Es gab nie eine richtige Fassung. Vier der sieben Einträge im Schriftmenü des Editors waren also seit vier Monaten Dekoration: die Datei lud ohne 404, der Browser fand keinen Glyphen und fiel zeichenweise auf Arial zurück.

---

## 2 · Was jetzt da ist

| | Dateien | Bytes | brauchbar |
| --- | --- | --- | --- |
| alt | 10 | 195.276 | **keine einzige** |
| neu | **7** | **144.608** | **alle sieben** |

**25 % leichter und zum ersten Mal funktionsfähig.** Die Entdopplung ist kein Feinschliff: Google liefert Roboto und Inter heute als *variable* Schrift — 400 und 700 bzw. 400, 500 und 600 zeigen auf dieselbe Datei. Zehn Namen beizubehalten hätte **139.648 Bytes bitgleiche Duplikate** bedeutet. Stattdessen je eine Datei mit `font-weight: 100 900`; beide tragen eine echte `wght`-Achse (`fvar` nachgelesen), und damit ist jedes Gewicht dazwischen nutzbar — was der alte Zehnerbau nicht konnte.

**Der Beweis am laufenden Browser**, am echten Menüweg im Wiki-Editor bei 14 px Schriftgröße, gegen den Rückfall ohne die erste Familie:

| Wahl im Menü | gerendert | Rückfall | Abstand |
| --- | --- | --- | --- |
| Inter | 423,36 px | 395,05 px | **+28,31** |
| Poppins | 440,59 px | 395,05 px | **+45,55** |
| Source Sans Pro | 369,05 px | 395,05 px | **−26,00** |
| Roboto | 393,16 px | 395,05 px | **−1,89** |

Vorher war dieser Abstand bei allen vier **bitgleich null**.

Und die Gewichte sind echt, nicht nachgetäuscht. Über die Reihe 100…900 gemessen: **Poppins liefert drei verschiedene Breiten bei drei deklarierten Gewichten**, Source Sans Pro zwei bei zwei — und Roboto und Inter unterscheiden 400 von 500, wo die statischen Familien bitgleich bleiben, weil dort kein 500 deklariert ist.

---

## 3 · Die Wächter, und warum sie keine Buchhaltung sind

Zuerst entstanden das Messwerkzeug (`tools/pruefe-schriftdateien.js`) und zwei Ratschen, solange die Dateien noch kaputt waren — mit **gezählten Ausnahmelisten**, auf denen alle zehn Dateien und alle vier Familien standen.

**Der Austausch hat sie dann von selbst rot gestellt: 31 failed / 23 passed.** Die Verwesungsprobe feuerte für alle zehn Altnamen, die Nicht-Leerlauf-Kontrollen feuerten, weil die festgenagelten Kyrillisch-Zahlen nicht mehr stimmten. Das ist der Beleg, dass die Listen nicht bloß mitgeschrieben haben. Danach wurde die Messlogik umgekehrt: bisher war **Gleichheit** der Befund, jetzt ist es **Ungleichheit**, und beide Ausnahmelisten sind **bewusst leer, nicht abwesend**.

Die Liste der Tore, jedes mit Mutationsbeweis:

- **Die Dateiliste kommt aus `fonts.css`**, nirgends als Literal — eine achte Datei wird automatisch mitgeprüft. Ein konkreter Dateiname im Werkzeug stellt einen eigenen Wächter rot (er hat mich erwischt, siehe §5).
- **`fonts.css` ↔ `sw.js` ↔ Verzeichnis** müssen mengengleich sein, nicht nur gleich lang.
- **Jede Datei ist die, für die `fonts.css` sie ausgibt** — die Schrift sagt selbst, wer sie ist: `name`-Tabelle und `usWeightClass`. Der Kreuztausch zweier Poppins-Schnitte lief vorher durch **vier** Tore grün.
- **Jeder Menüeintrag ist gedeckt** — ein achter `EDITOR_FONTS`-Eintrag ohne `@font-face` lief vorher durch die **volle** Jest-Suite.
- **Der Build bricht ab**, wenn Schriften fehlen, wenn ein Verweis im Bündel nicht auflöst, oder wenn die Lizenz fehlt. Vorher gab es dafür eine Warnung und Exit 0.
- **`tools/fetch-fonts.py`** holt die sieben neu — die Reparatur ist wiederholbar, nicht einmalig.

---

## 4 · Was die Prüfung besser gemacht hat als mein Auftrag

**Chromium täuscht keine Fettschrift vor.** Ich hatte vorgegeben, Source Sans Pro bei Gewicht 700 werde nachgetäuscht und genau das sei der sichtbare Unterschied. Gemessen messen 600 und 700 **bitgleich** 1088,20 px: über 700 ist kein Gewicht deklariert, also wird 600 gewählt, und auf ein halbfettes Face kommt keine synthetische Fettung dazu. Bitgleichheit ist die härtere Zusicherung als „irgendein Unterschied" — darauf wurde gebaut statt auf meiner Annahme.

**Mein `font-weight: 100 900` hatte eine zweite, versteckte Wirkung.** `document.fonts.load('100 900 16px "Roboto"')` ist keine gültige CSS-Kurzschreibweise; der Aufruf wirft, und ein `catch` schluckte es. Roboto und Inter standen damit auf `unloaded`. In der alten Messrichtung war das ein Falsch-**Grün** (Rückfall war ja der erwartete Befund), in der neuen ein Falsch-**Rot**. Geladen wird jetzt über die Einzelgewichte.

**Eine HarfBuzz-Falle.** `U+0100` (Ā) steht in **keiner** der sieben cmaps und rendert trotzdem aus Inter — 1352,23 px gegen 1055,63 px für reines `monospace`. HarfBuzz zerlegt per NFD und nimmt die Schrift, wenn Basis *und* Kombinierer darin stehen. Jede Probe mit „einem Zeichen, das die Schrift nicht hat" läuft darauf auf; die Kandidatenwahl überspringt jetzt alles NFD-Zerlegbare.

**Ein vorbestehender Fehler, den nur die Methode fand.** Zwei Quelltext-Audits in `tests/unit/stability.test.js` verlangten `\n}\n` — ein `}` mit reinem LF. In jedem frischen `git worktree` unter Windows (`core.autocrlf=true`, keine `.gitattributes`) fallen sie um; im Hauptbaum liefen sie grün. Rot bewiesen, behoben. Gleiches Muster wie beim Mobil-Layout: *die Prüfung lief in einer Umgebung, die den Fehler verdeckte.*

---

## 5 · Drei eigene Fehler

**Ich habe eine falsche Tatsache in sieben Dateien verteilt.** In den Kopfkommentar von `fonts.css` schrieb ich „keine einzige Datei kannte ein lateinisches `A`" — die Agenten haben den Satz aus meinem Auftrag in sechs weitere Dateien übernommen. Nachgemessen: **fünf der zehn trugen ein großes `A`** (Inter dreimal, Source Sans Pro zweimal). Richtig ist, dass keine ein kleines `a`, einen Umlaut oder ein Eszett trug. Der Schluss bleibt, die Zahl war falsch. Die Lehre gehört mir: ein falscher Satz im Auftrag landet überall.

**Meine Playwright-Vorgabe war falsch, und zwar schon im Tastatur-Bericht.** Ich hatte „634 / 0 Fehlschläge" für `4e0d810` genannt. Gemessen sind es dort **629 bestanden / 5 fehlgeschlagen** — ich hatte *gelaufene* Fälle gezählt, nicht bestandene. In der „vorher"-Spalte von `TASTATUR-BERICHT.md` steht dieselbe Zahl mit demselben Fehler.

**Ich habe `git add -A` benutzt** und damit den untracked Ordner `Anpassungen/` und `.planning/milestone.lock` in einen Commit gezogen, die diese Sitzung über bewusst draußen geblieben sind. Zurückgenommen, der Commit trägt jetzt zehn Dateien.

Dazu zwei kleinere: Teil 9 nutzte zuerst `expect(wert, meldung)` — diese Jest-Installation kennt das Meldungsargument nicht, das ist Playwright-Idiomatik. Und `Buffer.from()` riss das Lint-Gate, weil `Buffer` in der ESLint-Konfiguration von `tools/` kein Global ist.

---

## 6 · Alle Tore, von mir unabhängig nachgefahren

| | Ausgangsstand `4e0d810` | jetzt `e4f3c72` |
| --- | --- | --- |
| Jest | 2.137 (78 Suiten) | **2.226 (79 Suiten)** |
| Playwright | 629 bestanden / **5 Fehlschläge** / 39 übersprungen | **652 / 0 / 39, exit 0** |
| pytest, Projektbaum | 25 + 5 übersprungen | **61 bestanden** |
| pytest, **frischer Baum ohne `dist/`** | — | **56 + 5 übersprungen, 0 Fehlschläge** |
| Lint | 363, exit 0 | **363, exit 0** |
| `tsc --noEmit` | grün | **exit 0** |
| Builds dev + prod | grün | **beide exit 0** |
| beide Wächter | OK | **OK** |
| Stil-Sollstand | — | **0 von 3.615 Digests bewegt** (frisch erhoben) |

**Die fünf Fehlschläge am Ausgangsstand sind vorbestehend** — die bekannten 30-Sekunden-Zeitüberschreitungen in `eingaberahmen.spec.js` (W6-R-07), die im Tastatur-Bericht als „lastabhängig" geführt wurden. Dieser Zweig hat sie mit einem gemessenen 90-Sekunden-Dach behoben; die Datei stand nicht auf meiner Verbotsliste, und es wurde keine Zusicherung dort geschwächt.

**Der verbotene Rand ist leer**, nachgezählt: `CLAUDE.md`, `core/constants.js`, `ui/editors/editor-toolbar-build.js`, `assets/templates/` und die Sollstand-Datei haben **null** Zeilen im Diff. Die sieben `woff2` sind bitgleich zu den Dateien, die ich vor dem Einbau geprüft habe.

**Lizenzlage sauber.** Alle vier Familien stehen unter SIL OFL 1.1. Bedingung 2 verlangt, dass jede Kopie den Urhebervermerk **und** den Lizenztext mitführt — `dist/` wird veröffentlicht und `sw.js` spielt die Dateien beim Nutzer aus, beides sind Kopien. `assets/fonts/OFL.txt` trägt die vier Vermerke (aus den Dateien gelesen, nicht abgeschrieben) und den Lizenztext; `build.py` nimmt sie mit, und ihr Fehlen beendet den Build (gemessen: Exit 1 ohne, Exit 0 mit).

---

## 7 · Offen

1. **`CLAUDE.md:341` und `:770`** sind überholt: „Google Fonts loaded via `build.py` HTML template" und „Google Fonts fallbacks". Seit D-07 gibt es keinen CDN-Verweis mehr — im Prod-Bündel null Treffer, im Dev-Bündel genau einer, und das ist ein CSS-Kommentar. **Nicht geändert, weil `CLAUDE.md` deine Datei ist.** Zwei Zeilen, wenn du willst.
2. **`.gitattributes` fehlt.** Das ist die strukturelle Ursache der CRLF-Funde: derselbe Quelltext hat im Hauptbaum LF und im frischen Worktree CRLF, und Prüfungen, die auf Zeilenenden sehen, urteilen je Umgebung anders. Eigene Aufgabe, kleine Datei, Wirkung über den ganzen Baum.
3. **Eine Restlücke, die ich nicht schließen konnte:** ein Urteil, das hart auf „trägt alles" verdrahtet wäre, lässt sich an sieben *gesunden* Dateien grundsätzlich nicht entlarven. Die synthetischen Gegenproben treffen die Leseschicht darunter, nicht das Urteil selbst. Zu schließen nur mit einer absichtlich defizitären Prüfdatei im Baum.
4. **W6-R-07 bleibt lastempfindlich** — das 90-Sekunden-Dach macht die fünf Fälle zuverlässig, nicht schnell. Die festen Wartefristen sind die Ursache.
5. **Nicht gepusht.** Der Zweig liegt lokal; PR #3 und PR #4 sind unberührt.

---

## 8 · Nachkontrolle

Die Probe ist kurz, und sie ist die erste, die es überhaupt geben kann:

1. **Wiki öffnen, Text eintippen, markieren, im Schriftmenü „Inter" wählen.** Ändert sich die Schrift *sichtbar*? Bis gestern tat sie das nicht — man bekam Arial. Dann Roboto, Poppins, Source Sans durchgehen.
2. **Auf eine davon fett schalten.** Kommt echte Fettschrift, oder sieht es nach gequetschtem Normalschnitt aus?
3. **Die Gegenprobe, die genauso zählt:** Arial, Serif und Mono wählen — die drei, die immer funktioniert haben. Da darf sich **nichts** geändert haben.
4. **Und einmal offline:** Netzwerk trennen, App neu laden, Schritt 1 wiederholen. Es wird nichts nachgeladen; die Dateien liegen im Bündel.
