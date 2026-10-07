# Design-Handoff v3 — Welle 4 (Bewegung und Konsolidierung): Bericht und Sichtungsliste

**Stand:** 03.10.2026, HEAD `7e4aa09` auf Zweig `design-welle-4` · **Ausgangsstand:** `33dab42` · **33 Commits**, 23 Dateien, +4.203 / −806
**Grundlage:** `HANDOFF-v3/DESIGN-HANDOFF-v3.md` §5 Welle 4 (D-07, D-05)

---

## 1 · Der Handoff stellte die falsche Frage zur Entscheidung

Das ist der wichtigste Befund dieser Welle, und er kam aus der Vermessung, bevor eine Zeile geschrieben wurde.

Der Handoff wollte von dir wissen, ob die **Bewegungskurve** geändert werden soll, und nannte das „eine spürbare Änderung des Bewegungsgefühls". Gemessen: der größte Zeitversatz zwischen beiden Kurven in der **ganzen App** beträgt **9,2 ms**. Ein Bildschirmbild bei 60 Hz dauert 16,7 ms. Von 275 Übergangs-Segmenten liegt **keines** über 20 ms.

Was er dagegen als mechanischen „Schritt c" ohne Rückfrage behandelte — die **Vereinheitlichung der Dauern** — hätte nach seiner eigenen Vorgabe (120 ms) **91 von 275 Segmenten** um mindestens 20 ms verschoben. Das war die Entscheidung, die du wirklich getroffen hast.

### Die Zahlen, wie gehabt

| Behauptung | Gemessen |
| --- | --- |
| `transition: all` an **163** Stellen | **134** (vierfach gegengeprüft: Quelle, Bündel, eigener Parser, Referenzkopie) |
| „~13 tragende Stellen" | **4 bis 6**; scharf nachgemessen sind es **2** |
| Kategorie `filter` | **leer** — die einzige Fundstelle steht bereits in der Zielliste |
| „124 Dauer-Literale" | geht in keiner Lesart auf (294 Literale, 275 Segmente, 142 ohne `all`) |
| „drei `--trans-reveal`-Overlays" | **einer**; alle drei Anker zeigen ins Leere |
| eigene Kurve bei `dice.css:621` | liegt **mitten in einem Kommentarblock aus Welle 2**; sie steht bei **:761** |
| „8 Dauern" und „12 Kurven" | **stimmen** — die einzigen zwei zutreffenden Zahlen dieser Welle |

---

## 2 · Deine Entscheidungen

| ID | Entschieden | Statt |
| --- | --- | --- |
| E1 | `--dur-fast` = **150 ms** | 120 ms (§3.5) — 21 statt 91 Segmente ändern ihr Tempo |
| E2 | Icon-Knöpfe **36 px** | 28 px (§3.7) — hätte die eigene dokumentierte Regel unterschritten |
| E3 | Chips **jetzt**, mit zwei vorgezogenen Schrift-Tokens | — |
| E4 | `ease` **behalten** | Umstellung hätte die App in 134 + 141 Segmente gespalten |

Bei **E2** widersprach der Handoff dem eigenen Code: über `.btn-icon` steht wörtlich *„Fläche ≥ 36px für Berührung"*, und `dashboard.css:646` erzwingt auf Berührungsgeräten 44 px.

---

## 3 · Was die Prüfung gefunden hat, was der Plan nicht wusste

**Zwei Ratschen sind aus Befunden entstanden, nicht aus dem Plan.** Die Umstellung von `transition: all` auf eine benannte Eigenschaftsliste lässt alles fallen, was die Liste nicht kennt:

- **`W4-R-02`** — zwei Schwebe-Knöpfe verloren ihre Ausblende. `visibility` steht nicht in `--trans-std`; ohne sie verschwindet das Panel sofort und die 300-ms-Ausblende ist nie zu sehen.
- **`W4-R-03`** — drei weitere Stellen verloren ihre tragende Eigenschaft.

Beide Male: erst Ratsche rot beweisen, dann reparieren. Genau diese Frage hatte der Handoff nicht gestellt.

**Ein Fehler im Vorbild.** Beim Bau der Konsolidierungs-Ratsche (als Nachbau von F-02) fiel auf: `ruleBodiesFor()` verbraucht seinen Anker und findet zwei aneinandergrenzende Regeln derselben Klasse nur abwechselnd — **fünf Befunde fehlten**. `W4-R-06` ankert per Rückschau und beweist das mit einer eigenen Probe.

**Die Ratsche prüft ihre eigene Regex.** Zwei Wächter der Wächter: eine Gegenprobe, dass der Scan überhaupt Bewegung liest (236 Deklarationen gegen Schranke 200, 20 Dateien gegen 15), und eine Verwesungsprobe der Ausnahmeliste. Ohne sie wäre ein leerer Dateisatz oder eine kaputte Regex grün durchgelaufen.

---

## 4 · Alle Tore, von mir unabhängig nachgefahren

| | vorher (`33dab42`) | jetzt (`7e4aa09`) |
| --- | --- | --- |
| Jest | 1.910 (75 Suiten) | **1.963 (75 Suiten)** |
| Playwright | 595 / 23 übersprungen | **595 / 27 / 0 Fehlschläge** |
| pytest | 30 | 30 |
| Lint | 363 = Pin | 363 = Pin |
| Typecheck / strict | grün | grün |
| Builds | grün | grün |
| DUBLETTEN / `!important` / Inline | 0 / 105 / 254 | **0 / 105 / 254** |
| beide Wächter | OK | OK |
| CLAUDE.md | — | unverändert |
| **`transition: all`** | **134** | **0** (Quellbaum und beide Bündel) |

Die +53 Jest-Fälle liegen vollständig in den sechs neuen Ratschen `W4-R-01` bis `-06`, je Describe aufgerechnet; kein bestehender Fall ging verloren.

**Stil-Sollstand:** 3.765 Blätter beiderseits, **0 Zugänge, 0 Abgänge, 257 geänderte Digests**. Bewegt haben sich ausschließlich `borderRadius` (257×), `padding` (238×), `fontSize` (238×) und `fontWeight` (193×) — **null** Änderungen an `color`, `backgroundColor`, `borderColor` und `boxShadow`. Die Wellen 1 bis 3 bleiben vollständig ruhig.

**Linux-Probe:** die volle Suite unter Verdana/Courier New = **595/23/0**. Dass die Umstellung wirklich griff, ist am laufenden Browser belegt; danach neu gebaut und die Einspielung per `cmp` als entfernt nachgewiesen. Waagerechter Überhang bei 1440 px: 21 vorher, 21 nachher, **0 neu**. Bei 375 px: 11 / 11.

---

## 5 · Die eine Stelle, die ich dir vorlege

**Die fünf Würfel-Aktionschips** (Vorteil, Nachteil, Stats, Krit, Gruppe) fallen von **38 auf 26 px** Höhe, Schrift 14,4 → 12 px. Das ist die stärkste Größenänderung der Welle.

Deine Entscheidung E3 lautete auf 26 px feste Chiphöhe — aber das waren *Filter*chips. Diese fünf sind keine Filter, sondern Schalter, die du im Kampf drückst; sie tragen die Chip-Klasse nur mit. Auf 375 px Telefonbreite sind sie damit die kleinste Berührungsfläche der Familie.

Keine Ratsche verbietet das: die 44-px-Schranke gilt `.btn`, `.nav-tab` und `.dice-btn`, nicht `.dice-chip`. Netto steigt die Zahl der Flächen unter 36 px von 75 auf 78.

**Ich kann sie aus der Chip-Familie herausnehmen** und auf ihrer alten Höhe lassen — Kosten: eine benannte Ausnahme und ein Kommentar. Auf dem Kontaktbogen (drittes Paar) siehst du, ob es nötig ist.

---

## 6 · Offen

1. **Fünf Bewegungsstellen außerhalb von CSS** bleiben unberührt (O-11): vier `style.transition` im JS, ein Inline-Stil im Template. Ausgewiesene Restschuld.
2. **Zwei Stellen springen künftig:** die aktive Initiative-Zeile im DM-Schirm und der aktive Eintrag im Inhaltsverzeichnis setzen einen linken Rand von 3 bzw. 2 px, der früher mitwuchs. Die *Farbe* bewegt sich weiter, nur die Breite springt.
3. **Korrektur am Plan:** die in Schritt 8 zu prüfende Ratsche heißt **R-16**, nicht R-14. Die Sorge war berechtigt gestellt, aber unbegründet — und statt das bloß festzustellen, wurde der Leerlaufschutz dreifach mutiert und jedes Mal rot.
4. `GATE-04` aus CLAUDE.md bleibt offen (vorbestehend, diese Welle hat die Werkzeugleisten nicht angefasst).
5. **Nicht gepusht.** Ob daraus ein eigener PR wird, entscheidest du.

---

## 7 · Sichtungsliste

176 Bilder in `tests/e2e/__screens__/welle-4/` (44 je Theme), dazu der Kontaktbogen. Neu erzeugen:

```bash
python build.py && WELLE4_SCREENS=1 npx playwright test tests/e2e/features/welle-4-screens.spec.js
```

**Die fünf Punkte, bei denen ich am ehesten mit Widerspruch rechne:**

1. **Die Chips in Pillenform** — 48 Stellen, Radius 12 → 999 px, Gewicht 400 → 500. Lesen sie in allen vier Themes noch als *anklickbar*, oder wirken sie wie Etiketten?
2. **Die fünf Würfel-Aktionschips** (siehe §5) — zu klein für den Spieltisch?
3. **Der Würfel-Neuwurf-Knopf** fällt von 44 × 44 auf 36 × 36. Er war der größte Icon-Knopf der App. Triffst du ihn noch, besonders auf einem Tablet?
4. **Das Schwebepanel der Würfel, ein und aus.** Es hat in dieser Welle zweimal seine Ausblende verloren und zurückbekommen. Bitte beide Richtungen prüfen — und darauf achten, ob nach dem Schließen eine Geisterfläche Klicks abfängt.
5. **Gemischtes Vokabular im Laden:** die Kategoriemarken darüber sind jetzt Pillen, die Sortierknöpfe darunter bleiben Rechtecke. Liest sich die Kopfzeile noch als *eine* Leiste?

Dazu: die 21 Stellen mit geändertem Tempo (Schwerpunkt Charakterbogen), die Zeitgeber-Knöpfe (zwei Kreise verschwinden aus der App), `.dms-live-badge` (7,7 → 11 px, war vorher praktisch unlesbar), die Marken, die Gewicht verlieren, und das Mobil-Profil bei 375 px.
