# Design-Handoff v3 — Welle 2 (Farbliterale): Bericht und Sichtungsliste

**Stand:** 29.09.2026, HEAD `03274fa` · **Ausgangsstand der Welle:** `ba3d3c2` · **126 Commits**
**Grundlage:** `HANDOFF-v3/DESIGN-HANDOFF-v3.md` §5 Welle 2 (D-02), dazu die Tönungsstellen aus D-4 und die Restposten der Welle 1

---

## 1 · Vorbemerkung: die Zahlen waren wieder überholt

Wie in Welle 1 wurde vor der ersten Zeile nachgemessen. Ergebnis: **sechs von sieben Zahlen der Klassifikation sind falsch**, die größte Abweichung um den Faktor 9.

| Kennzahl | Handoff | Gemessen |
| --- | --- | --- |
| Literale insgesamt | 390 | **336** (davon 247 im Revier der Welle) |
| exakte Theme-Treffer | 198 | **162** |
| Weiß-Auflagen | 35 | **29** |
| Schwarz außerhalb Schatten | 66 | **6** |
| aus fremder Theme-Palette | 25 | **5** im Revier (11 weitere in Schatten) |
| palettenfremd | 66 | **28** |

**85 Literale stecken in Schatten-Deklarationen** und gehören zu Welle 3 — der Handoff nennt diese Überschneidung nur als Reihenfolgehinweis, nie als Zahl.

Zwei weitere Korrekturen:
- Der Beleganker **`tools.css:1517 #ffd700` hat nie existiert.** Die Datei trägt in ihrer gesamten Historie keinen einzigen Hex-Wert; der Handoff hat ein rgba-Tripel als Hex paraphrasiert.
- Eine **sechste Klasse fehlt** im Handoff völlig: 17 Literale treffen Tokens des themenunabhängigen Aliasblocks (Schadensarten, Warenkategorien, Wissensgebiete).
- Das Rezept „exakter Treffer → `color-mix`" ist **nicht mechanisch entscheidbar**: Nur 20 von 43 Tripeln lassen sich genau einem Token zuordnen; sieben treffen mehrere Namen gleichzeitig.

---

## 2 · Entscheidungen dieser Welle

| ID | Entschieden | Von |
| --- | --- | --- |
| E1 | Eindeutige Fremdfarben auf ihre Rolle angleichen; Pergament auf sein vorhandenes Alias; die sechs mehrdeutigen Goldstellen auf `--gold` | Nutzer |
| E2 | Tönung je Theme gedeckelt: **Dark 13 %, Light 7 %, Sepia 7 %, Contrast 20 %**, Schrift bleibt farbig | Nutzer |
| E3 | Schnellreferenz meldet das Überfahren über einen **Umriss** statt über eine Füllung | Nutzer |
| E4 | Kein Rückfall an den Flächen, aber `@supports` um die abgeleiteten Tokens; Browser-Mindestanforderung dokumentiert | Orchestrator |
| E5 | Geltungsbereich: CSS-Module plus die 15 benannten Farben aus Welle 1; Templates und JS-Hex bleiben außen | Orchestrator |
| E6 | Ereignis-Log behält die dunkle Blende, bekommt themenblinde Schrift | Nutzer |

---

## 3 · Ergebnis

**Gates, von mir unabhängig nachgefahren (HEAD `03274fa`):**

| Prüfung | Vor der Welle | Nach der Welle |
| --- | --- | --- |
| Jest | 1.739 | **1.786** (71 Suiten) |
| `design-consistency.test.js` | 86 | **114** |
| Playwright | 381 / 7 übersprungen | **381 / 11 übersprungen / 0 Fehlschläge** |
| pytest | 30 | **30** |
| Lint | 363 = Pin | **363 = Pin** |
| Typecheck / strict | grün | grün |
| Builds | grün | grün |

**Stil-Sollstand:** 24 von 3.626 Digests geändert, **0 Zugänge, 0 Abgänge**. Bei allen 24 ändert sich genau eine Eigenschaft, die Hintergrundfarbe — Chromium schreibt `color-mix` anders (`color(srgb …)` statt `rgba()`), zeichnet aber bildpunktgleich.

**Die drei strukturellen Lücken, die die Gegenprüfung fand und schloss:**

1. **Tönungen in Farbverläufen** wurden von keiner Ratsche erfasst.
2. **Quergriffe**: Fläche im Elternelement, Schrift im Kindelement — vier solche Paare im Baum, einer davon unlesbar.
3. **Zustandsregeln**, die beim Überfahren die Fläche wechseln, die Schrift aber aus der Grundregel erben. Diese Bauart beurteilte niemand; beim Nachziehen fielen sechs weitere unlesbare Stellen auf.

Alle drei sind jetzt bewacht (erweiterte R-04, neue R-14 und R-18). Ohne sie wäre jede dieser Stellen bei der nächsten Änderung still zurückgefallen.

---

## 4 · Offen

1. **Eine Begründung in der Aktenlage nennt die entscheidende Zahl nicht** (`W2-D-06`). Reine Dokumentationsgenauigkeit, der Code ist korrekt.
2. **`.backup-entry-restore:hover`** bleibt unter 4,5 (3,15–3,74). Weder Deckel noch Tintenkorrektur allein reichen; gegen die tatsächliche Trägerfläche `--bg-hover` trägt keine der geprüften Fassungen. Gehört zu derselben Frage wie die vier Attribut-Kürzel aus Welle 1 (`W1-B-01`).
3. **Umgekehrte Zustandsleiter bei `.pwa-install-btn`**: Der gedrückte Knopf wird in Light und Sepia blasser als der überfahrene, weil nur `:active` unter den Deckel fällt. Im CSS kommentiert, in der Aktenlage als `W2-D-05` geführt.
4. **Aus Welle 1 weiterhin offen:** die D-6-Ratsche wurde in Welle 2 nachgezogen; die vier Attribut-Kürzel beim Überfahren sind durch E3 erledigt.

---

## 5 · Sichtungsliste für die Vier-Themes-Runde

Bilder: `tests/e2e/__screens__/welle-2/` (108 Stück, lokal). Neu erzeugen:

```bash
python build.py && WELLE2_SCREENS=1 npx playwright test tests/e2e/features/welle-2-screens.spec.js
```

**Reihenfolge:** erst **Light**, dann **Sepia** (dort ändert die Welle am meisten), dann Contrast, zuletzt Dark.

1. **Light und Sepia — die sichtbarste Änderung:** Die Füllung der farbigen Felder sinkt von 20 % auf 7 %. Betroffen sind Schatzkammer, Zauber, Begegnungen, Initiative und NSC. Zu prüfen: Wirkt eine Marke noch als Marke, oder wie farbige Schrift auf blanker Karte? **Hier wäre zu widersprechen.**
2. **Dark, dieselben Ansichten:** Deckel bei 13 %. Stehen zwei Felder nebeneinander, die vorher verschieden stark waren und jetzt gleich aussehen? Eine verlorene Abstufung wäre ein Befund.
3. **Contrast:** Nur die kräftigsten Marken (30 %) sinken auf 20 %. Verlieren sie ihr Signal?
4. **Roter W20-Knopf unten links:** trägt jetzt die echte Rotrolle, in Dark sichtbar heller. Hebt er sich noch von den übrigen Würfelknöpfen ab?
5. **Zauberkarten-Kopfzeile**, in Ruhe und beim Überfahren: eigene Violettrolle statt Fremdfarbe. Ist der Kopf noch vom Rumpf zu unterscheiden?
6. **Schnellreferenz** (`/` drücken, Reiter „Regeln", Zeile überfahren): Umriss statt Füllung. Ist das als Rückmeldung erkennbar und **nicht** mit dem Tastaturfokus zu verwechseln?
7. **Ereignis-Log** (eine Aktion mit Meldung auslösen): in Light und Sepia erstmals lesbar. Wirkt die Blende noch dunkel, behalten die Randstreifen ihren Ton?
8. **Werkzeuge/Suche:** sechs Goldstellen wechseln von Münzgold auf die Gold-Rolle. Stehen zwei verschiedene Goldtöne nebeneinander?
9. **Soundboard:** die Laufschiene folgt jetzt dem Theme. Hebt sich der goldene Fortschrittsbalken überall ab?
10. **Neutrale Zustands- und Beziehungsmarken** (Initiative, DM-Screen, NSC): Schreit die neutrale Marke jetzt lauter als eine rote oder grüne? Eine umgekehrte Rangfolge wäre ein Befund.
11. **Schatzkammer in Light und Sepia:** Die fünf Seltenheitsfarben werden als Schrift deutlich dunkler. Sind die fünf Stufen **untereinander** noch unterscheidbar?
12. **DM-Screen, Widget „Fertigkeiten":** Die Attributköpfe verlieren ihre Schriftfarbe, die Tönung trägt die Zuordnung allein. Ist noch zu sehen, welche Fertigkeit zu welchem Attribut gehört?
13. **Zustand „liegend"** (Initiative, DM-Screen): wechselt auf die hellere Orange-Rolle wie seine Geschwister. Passt es jetzt zusammen?
14. **Verweis-Pillen und Konzentrations-Marken beim Überfahren:** Ruhe- und Hover-Fläche fallen jetzt zusammen; sichtbar bleibt nur noch die leichte Bewegung. Reicht das als Rückmeldung?
15. **PWA-Hinweis:** Der gedrückte Knopf ist in Light und Sepia blasser als der überfahrene (siehe §4 Punkt 3). Stört das?
16. **Wiederherstellen-Knopf** in der Backup-Liste: merklich helleres, entsättigtes Rot im Ruhezustand.
17. **Quer durch alle Ansichten in Light oder Sepia:** Fällt **eine** Marke auf, die deutlich stärker oder schwächer gefüllt ist als ihre Nachbarn? Das wäre ein Tippfehler im Prozentwert — die einzige Fehlerart dieser Welle, die keine Ratsche fängt.

---

## 6 · Abnahme

**Vier-Themes-Runde am 29.09.2026 durchgeführt, Antwort des Nutzers: „abgenommen".** Keine Funde gemeldet. Die offenen Punkte aus §4 bleiben davon unberührt und wandern in Welle 3.

Es folgt Welle 3 (Schatten als Höhenstufen). Dort liegen die 85 Literale, die diese Welle bewusst ausgelassen hat.
