# Design-Handoff v3 — Welle 1 (Farbe): Bericht und Sichtungsliste

**Stand:** 29.09.2026, HEAD `ba3d3c2` · **Ausgangsstand der Welle:** `ca85d1b` · **80 Commits**
**Grundlage:** `Anpassungen/Design-Konsistenz und Verbesserungen/HANDOFF-v3/DESIGN-HANDOFF-v3.md`, §5 Welle 1 (D-01, D-03, D-10)

---

## 1 · Vorbemerkung: die Zahlen des Handoffs waren überholt

Vor der ersten Codezeile wurde jede Kennzahl des Handoffs gegen den Quellbaum nachgemessen. Ergebnis: **Die Diagnosen tragen, die Zahlen nicht.** Sämtliche Farbzahlen in §1 und §4 sind der Stand **vor** dem Löschlauf aus Phase 15 — obwohl das Dokument diesen Löschlauf selbst als gültige Grundlage führt.

| Kennzahl | Handoff | Gemessen |
| --- | --- | --- |
| `rgba()`-Literale im Komponenten-CSS | 390 | **336** |
| davon exakte Dark-Token-Treffer | 198 | **167** |
| `color: var(--bg-dark)` | 100 | **95** |
| `color: white` | 51 | **48** |
| `box-shadow`-Deklarationen | 88 | **71** |

Vier von sieben Zeilenankern der Farbabschnitte zeigen ins Leere (der Löschlauf hat 5.148 Zeilen entfernt). **Jede Stellenliste wurde deshalb frisch erzeugt**, kein Anker des Dokuments wurde als Arbeitsposition übernommen.

**Exakt bestätigt** wurden dagegen alle **40 Zellen** der Tinten-Tabelle (§3.1) auf die zweite Dezimale, ebenso die Kernbelege 1,74:1 (Weiß auf Dark-Grün), 2,98/3,02 (Light-Knöpfe) und 1,71/1,47/1,53/2,82 (Rahmenkontrast).

**13 Rezepte mussten korrigiert werden.** Die vier schwersten:

1. „Sepia-Violett erreicht mit **keiner** Tinte 4,5" — falsch. Reines Schwarz erreicht 4,80 (erschöpfend über alle 256 Graustufen geprüft).
2. Die `--<rolle>-text`-Werte waren nur gegen **eine** Trägerfläche gerechnet, landen aber auf **vier**. Gegen alle vier fielen 16 von 18 Werten durch — und die vorgeschlagene Ratsche hätte genau diese Lücke grün gemeldet.
3. „7 Test-Zusicherungen sind anzupassen" — es gibt genau **eine**, und die stammt nicht aus CSS.
4. Die Attribut-Regel „Farbtonabstand ≥ 40°" ist **heute schon verletzt** (30° zwischen Charisma und Stärke) und wäre als Ratsche sofort rot.

---

## 2 · Entscheidungen dieser Welle

| ID | Frage | Entschieden |
| --- | --- | --- |
| D-1 | Sepia-Violett unter 4,5 | **Fläche abdunkeln** auf `#6266bd` (weiße Schrift 5,05) — *Nutzer* |
| D-2 | Gegen wie viele Trägerflächen rechnen | **Alle vier** (`--bg-card`, `--bg-dark`, `--bg-elevated`, `--bg-hover`) — *Orchestrator* |
| D-3 | Auch Dark/Contrast korrigieren | **Ja**, 5 Zellen mit eigenen aufgehellten Werten — *Nutzer* |
| D-4 | 108 Tönungsstellen | **Erst Welle 2** (Tinte und Tönungsstärke gehören zusammen entschieden) — *Nutzer* |
| D-5 | Münz- und Attributfarben | **Gemischt**: Münzen werden Flächen mit Tinte, Attribute nur so weit abgedunkelt wie nötig — *Nutzer* |
| D-6 | Unterscheidbarkeit der Attributfarben | Ratsche als „darf nicht schlechter werden" statt fester 40° — *Orchestrator* · **noch nicht geschrieben, siehe §5** |
| D-7 | Ortsfilter-Farbe aus JS | Die eine genehmigte Zeile **plus Rückfall** für alte gespeicherte Farbwerte — *Orchestrator* |
| D-8 | Eingabe-Rahmen Dark | **`#7c7c7c`** statt `#6b6b6b` (sonst 2,88 auf `--bg-elevated`, wo 5 Felder sitzen) — *Orchestrator* |

---

## 3 · Was umgesetzt wurde

- **35 neue Tokens je Theme-Block**, in allen vier Themes symmetrisch.
- **183 Stellen** tragen die passende Tinte auf gefüllter Akzentfläche (55× `--on-gold`, 39× `--on-red`, 26× `--on-green`, 18× `--on-purple`, 12× `--on-cyan`, Rest gelb/orange/blau/rosa).
- **231 Stellen** nutzen Akzentfarben als Schrift über `--<rolle>-text` (114× Gold, 42× Cyan, 25× Rot, 20× Grün …).
- **`color-scheme`** je Theme — Häkchen, Auswahlpfeile, Zahlenfeld-Pfeile und Bildlaufleisten folgen erstmals dem Theme.
- **Münz-Pillen** statt Münz-Schrift, **Pergament-Tinte** für den Statblock, **`--border-input`** ≥ 3:1 auf allen Eingabeflächen.
- **Ein JS-Eingriff**, wie genehmigt: `locations-render.js` setzt die passende Tinte zur Filterfarbe, mit Rückfall für unbekannte Altwerte.

**Ein Blocker wurde in der Gegenprüfung abgefangen:** Drei „+ Neu"-Knöpfe hätten beim Überfahren die neue dunkle Schrift auf eine hellere abgeleitete Fläche (`--green-dim`) geerbt — der Kontrast wäre dort von 6,59 auf **2,63** gefallen. Der Handoff lässt offen, ob abgeleitete Hover-Flächen eine eigene Tinte brauchen; die Messung beantwortet das mit ja. Dasselbe traf `.btn-gold:hover` und einen Knopf, der beim Überfahren die Flächenrolle von Orange auf Rot wechselt, die Tinte aber behielt.

---

## 4 · Ratschen und Abnahme

**Neue Ratschen:** R-01 (Theme-Symmetrie), R-02 (Tinte, vier Teilformeln über die tatsächlichen Trägerflächen), R-03 bis R-09 (Zustandstinte, `--on-*`-Aufsicht, Kaskade, Zeilenanker, Pergament, Münzflächen, Ortsfarben). `F-14` wurde umgeschrieben: Die alte Fassung verlangte wörtlich die **Flächenfarbe als Tinte** und fror damit genau den Mangel ein, den sie finden sollte.

**Gates (von mir unabhängig nachgefahren, HEAD `ba3d3c2`):**

| Prüfung | Vor der Welle | Nach der Welle |
| --- | --- | --- |
| Jest | 1.694 / 70 Suiten | **1.739 / 71 Suiten** |
| `design-consistency.test.js` | 67 | **86** |
| Playwright | 381 bestanden / 3 übersprungen | **381 bestanden / 7 übersprungen / 0 Fehlschläge** |
| pytest `tests/build` | 30 | **30** |
| Lint | 363 = Pin | **363 = Pin** |
| Typecheck / strict | grün | grün |
| Builds (dev + prod) | grün | grün |

Die 4 zusätzlichen Skips sind der neue Ablichtungs-Spec, der ohne `WELLE1_SCREENS=1` übersprungen wird.

**Stil-Sollstand:** Neu erhoben, aber erst nach schlüsselweisem Vergleich. Ergebnis über 3.626 Schlüssel: **254 geänderte Digests, 0 Zugänge, 0 Abgänge.** Das ist die Signatur einer reinen Farbänderung — wären Elemente verschoben oder verschwunden, hätte es Zu- oder Abgänge gegeben, und dann wäre nicht committet worden.

---

## 5 · Offen

1. **Die D-6-Ratsche fehlt.** Die Unterscheidbarkeit der sechs Attributfarben ist nicht abgesichert. Gehört in Welle 2 nachgezogen.
2. **Vier Attribut-Kürzel** fallen beim Überfahren der Zeile in Dark und Contrast auf 3,16–3,58:1. Dafür braucht es eine Entscheidung: Zeilenfarbe beim Überfahren ändern, Kürzel aufhellen, oder als Ausnahme führen.
3. **Fünf JS-Stellen** mit derselben Fehlerart wie D-7 (Quests, Zauber) sind noch nicht erfasst — sie gehören in die Welle, die JS-gesetzte Flächen anfasst.
4. **Nicht aus dieser Welle:** Der Ereignis-Log unten ist in Light und Sepia kaum lesbar (`party.css:572` trägt eine fest verdrahtete dunkle Fläche). Älter als Welle 1.
5. **Kleinigkeit:** Ein Ordner `test-results/` im Wurzelverzeichnis (eine Datei, von einem Playwright-Aufruf ohne Projektkonfiguration). Entweder löschen oder in `.gitignore` aufnehmen.

---

## 6 · Sichtungsliste für die Vier-Themes-Runde

Bilder: `tests/e2e/__screens__/welle-1/<ansicht>-<theme>.png` (108 Stück, lokal, nicht versioniert). Neu erzeugen mit:

```bash
python build.py && WELLE1_SCREENS=1 npx playwright test tests/e2e/features/welle-1-screens.spec.js
```

Die Bilder **ersetzen die Runde nicht**: Der Seed kennt nur wenige Datensätze, und Modale, Aufklappmenüs sowie die meisten Hover-Zustände sind nicht darauf.

**Reihenfolge:** erst **Light**, dann **Sepia** (dort ändert die Welle am meisten und dort misst **kein** Test), dann Contrast, zuletzt Dark.

1. **Dunkle Schrift auf voller Akzentfläche** (183 Stellen). Nicht die Lesbarkeit prüfen — die ist gerechnet und bewacht —, sondern ob es *richtig aussieht*: Wirkt ein Knopf jetzt billig oder wie deaktiviert? Schwerpunkte: Kampf, Start, Begegnungen, Beute, Werkzeuge.
2. **Werkzeugleisten, alle 24 Ansichten:** der goldene Primärknopf trägt jetzt dunkle Schrift. Größte Einzelgruppe der Welle.
3. **Navigationsreiter, aktiver Zustand** — auch im **Mobilprofil bei 375 px**, dort greift eine eigene Farbstelle.
4. **Fraktionen:** die vier Ruf-Knöpfe (vorher 1,9:1 auf Grün, praktisch unlesbar). Dazu die Ruf-Historie: negative Einträge sind im Dark-Theme **heller** geworden.
5. **Helleres Dark-Rot als Schriftfarbe** (33 Stellen): Lösch-Knöpfe, Zurücksetzen, d100-Würfel. Wirkt das Rot noch warnend genug?
6. **Dunklere Akzent-Textfarben in Light und Sepia** (231 Stellen, davon 114× Gold). **Hier misst kein Test** — die Sichtung haftet allein.
7. **Sepia-Violett** (`#6266bd`): wird es noch als Violett gelesen oder als Blau?
8. **Münz-Pillen** im Finanz-Widget: aus farbigem Text sind farbige Pillen geworden. Sind die vier Metalle noch auseinanderzuhalten?
9. **Attribut-Kürzel** in Party-Karten und DM-Screen: in Light/Sepia alle sechs abgedunkelt. Auf einen Blick unterscheidbar?
10. **Formularelemente** — die riskanteste Stelle, weil hier der Browser zeichnet: Häkchen, Auswahlpfeile, Zahlenfeld-Pfeile, Bildlaufleisten, Datums- und Farbwähler. In **allen vier** Themes prüfen, besonders die Reise-Ansicht und die Filterleisten.
11. **Würfel-Ansicht:** die zwölf Attributs- und Rettungswurf-Knöpfe standen vorher bei 1,3:1 (unsichtbar) und stehen jetzt weiß. Bereich „Charakter-Würfe" aufklappen.
12. **NPCs und Orte:** die Detail-Knöpfe standen bei 1,05:1, also buchstäblich unsichtbar. Dazu die Ortsfilter: eine Kampagne mit einem **alten, von Hand bearbeiteten** Farbwert testen — dann greift der Rückfall.
13. **Initiative:** HP-Zahlen, Effekt-Marken, Konzentration, Todesretter. Kampf mit mehreren Kombattanten herstellen, einen auf 0 HP setzen, einen konzentrieren lassen.
14. **Beute:** Seltenheitsmarken und Filter-Chips. **Statblock:** wirkt er in allen vier Themes noch wie Pergament?
15. **Editor mit aktivem Format:** Text auswählen, Fett/Kursiv/Marker setzen — ist der aktive Knopf noch als aktiv erkennbar? Der Marker selbst ist ausgenommen und unverändert.
16. **PWA-Hinweisleiste und Umzugsassistent:** die gelbe Leiste trägt jetzt dunkle Schrift.
17. **Ereignis-Log** (siehe §5 Punkt 4) — in Light/Sepia kaum lesbar, **nicht** aus dieser Welle, aber in der Runde unvermeidlich.
18. **Allgemein:** Sieht dieselbe Komponente in jeder Ansicht gleich aus? Ist irgendwo Text verschwunden, der vorher da war?

---

## 7 · Abnahme

**Vier-Themes-Runde am 29.09.2026 durchgeführt, Antwort des Nutzers: „abgenommen".** Keine Funde gemeldet. Die drei offenen Punkte aus §5 bleiben davon unberührt und wandern in Welle 2.

Damit ist Welle 1 abgeschlossen. Es folgt Welle 2 (Farbliterale → `color-mix`, Auflagen-Tokens, die 108 Tönungsstellen aus D-4).
