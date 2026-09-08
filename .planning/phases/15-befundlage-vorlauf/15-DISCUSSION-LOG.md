# Phase 15: Befundlage & Vorlauf - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-08
**Phase:** 15-Befundlage & Vorlauf
**Areas discussed:** Entscheidungsprotokoll & Handoff-Korrektur · Die drei sichtbaren Defekte ·
Geltungsbereich & Abnahmeaufwand · Mechanik-Blocker mit großer Reichweite

---

## Verlauf dieser Sitzung

Die vier Bereiche wurden dem Nutzer zur Auswahl vorgelegt. Der Auswahldialog wurde **abgebrochen**;
es erfolgte keine Auswahl. Auf die anschließende Anweisung „Führe alle Bereiche nach deinen
Empfehlungen aus" wurden alle vier Bereiche ohne Rückfragen entschieden.

**Es gab damit keine Nutzerantworten.** Die Spalte „Gewählt" unten dokumentiert Claudes Wahl unter
dieser Anweisung, nicht die des Nutzers. Vier Entscheidungen sind in CONTEXT.md § Claude's
Discretion ausdrücklich zur Bestätigung markiert, weil sie sichtbares Verhalten oder die
Arbeitslast des Nutzers betreffen.

**Wie die Entscheidungen zustande kamen.** Statt sie zu setzen, wurden sie in drei Stufen
erarbeitet, nach der als Key Decision gebuchten Projektregel „verifizieren statt übernehmen":

1. **Acht Entscheidungscluster** über die zehn offenen Blocker und die Phase-15-Requirements, jeder
   mit der Auflage, jede tragende Zahl selbst gegen HEAD `4faca38` zu messen statt sie aus
   `HANDOFF-V2-VERIFIKATION.md` zu übernehmen.
2. **Adversarische Gegenprobe** je Cluster mit dem Auftrag zu widerlegen, nicht zuzustimmen.
   **Alle sechs erstrunden Gegenproben kamen mit `holds=false` zurück**, jede mit mindestens einem
   Befund der Schwere „hoch"; sieben Cluster wurden daraufhin nachgebessert.
3. **Vollständigkeitskritik** gegen `REQUIREMENTS.md` und `ROADMAP.md`, die elf Widersprüche
   zwischen den parallel und blind füreinander laufenden Clustern und ein ungedecktes Requirement
   (BASE-03) fand.

Die sechs strittig gebliebenen Kennzahlen wurden anschließend einzeln mit je benannter Zählart neu
gemessen. Die Auflösung der Widersprüche steht in CONTEXT.md.

Der erste Lauf brach nach 15 von 23 Agenten am Monats-Ausgabenlimit des Nutzers ab und wurde aus
dem Cache fortgesetzt („Erneut versuchen"); der Fortsetzungslauf lief mit 25 von 25 Agenten durch.

---

## Entscheidungsprotokoll & Handoff-Korrektur

| Option | Beschreibung | Gewählt |
|--------|-------------|:---:|
| Eigener Abschnitt in PROJECT.md | Der einzige Ort, der für alle Phasen 16–19 garantiert vollständig gelesen wird | ✓ |
| Eigene Datei `DESIGN-DECISIONS-v1.3.md` | Sauber getrennt, aber von keinem Agenten zwangsläufig gelesen | |
| Nur der Phasen-CONTEXT | Fällt für Phase 19 aus dem Drei-Phasen-Lesefenster | |
| `.planning/DECISIONS-INDEX.md` anlegen | **Verworfen** — die Datei *ersetzt* die CONTEXT-Lektüre, statt sie zu ergänzen | |

**Claudes Wahl:** PROJECT.md-Abschnitt als kanonischer Ort, plus Pflicht-Spiegel über
`Canonical refs`-Zeilen in ROADMAP.md (D-01, D-02, D-03).
**Notizen:** Empirisch geprüft, was die Agenten tatsächlich lesen. Ergebnis: weder `gsd-planner`
noch `gsd-phase-researcher` liest PROJECT.md in seinem eigenen `<project_context>` — beide nennen
dort nur `./CLAUDE.md`. Der einzige Weg, der beide erreicht, ist der `<canonical_refs>`-Block, und
die ROADMAP hat heute **null** `Canonical refs`-Zeilen. Der Mechanismus existiert und ist ungenutzt.

| Option | Beschreibung | Gewählt |
|--------|-------------|:---:|
| Handoff in-place korrigieren | Die CHECKLISTE ist zugleich Abnahmevorschrift | ✓ |
| Korrekturschicht daneben | Ließe die Abnahme aus dem falschen Dokument fahren | |
| §8 ersatzlos löschen | **Verworfen** zugunsten einer VERWORFEN-Markierung mit Begründung | |

**Claudes Wahl:** In-place, aber Verworfenes wird markiert statt entfernt (D-04, D-05).
**Notizen:** `.dc.html` und `support.js` bleiben unberührt. Beim `transition: all`-Widerspruch gilt
der Abnahme-grep (163), nicht die Prosa-Zahl (151) — die Abnahme ist heute strenger als ihre eigene
Anweisung, und die strengere Fassung ist die richtige.

---

## Die drei sichtbaren Defekte

| Option | Beschreibung | Gewählt |
|--------|-------------|:---:|
| CSS folgt dem JS-Markup | Flache Struktur, Snapshots bleiben unangetastet | ✓ |
| JS auf die reichere CSS-Struktur heben | Schönere Optik, bricht aber das Phase-13-Regressionsnetz | |

**Claudes Wahl:** CSS folgt dem JS (D-09).
**Notizen:** `tests/unit/__snapshots__/dmscreen-characterization.test.js.snap` friert das Markup
aller drei Widgets ein (Phase-13 Key Decision D-04). CSS-Selektoren zu ändern bricht sie nicht,
JS-Markup zu ändern schon. Preis: die eigenen Beispiel-Tags im Gelände-Widget entfallen.

**Zwei Fehler in der Aufgabenstellung selbst gefunden.** REQUIREMENTS FIX-01 nennt die Widgets
„Gelände" und „Wissensgebiete", belegt das zweite aber mit `.dms-skill-header.str` — einer Klasse
aus „Fertigkeiten". Die Registry ist eindeutig (`knowledge` = Wissensgebiete, `skills` =
Fertigkeiten). Dazu zeigen beide zitierten Fundstellen ins Falsche: `dmscreen.css:2469-2510` ist der
Fertigkeiten-Block ohne ein einziges `.dms-terrain-*`, und der Gelände-Renderer liegt in
`dmscreen-widgets-combat.js`, nicht in `-reference.js`. Gemessen sind **alle drei** Widgets
betroffen — Fertigkeiten prozentual am stärksten. Entschieden: alle drei reparieren (D-10, D-11, D-12).

| Option | Beschreibung | Gewählt |
|--------|-------------|:---:|
| `char-slot-*` eigene CSS-Regeln geben | Die aktive Familie stylen | |
| Auf `.slot-pip` vereinheitlichen | Die gestylte, handlerkompatible Familie benutzen | ✓ |

**Claudes Wahl:** Vereinheitlichung, Funktionsname und Aufrufkette bleiben (D-14).
**Notizen:** Die Sachlage ist umgekehrt zu der, die die Aufgabenstellung voraussetzt. Der aktive
Renderer ist der ungestylte **und** der funktionslose: der Handler liest `data-id`/`data-value`,
`party-render.js` setzt `data-char`/`data-level`/`data-index` — ein Klick ruft heute
`toggleSpellSlot(null, NaN)` und bricht still ab. Ein dritter, nirgends dokumentierter Defekt.
Zwei Gegeneinwände wurden gemessen und fielen: die Zustandslogik ist **nicht** invertiert (beide
markieren die verfügbaren Plätze), und `.slot-pip` ist **nicht** media-gekapselt (Klammertiefe 0;
der nächste vorangehende `@media` schließt 45 Zeilen davor).

---

## Geltungsbereich & Abnahmeaufwand

| Option | Beschreibung | Gewählt |
|--------|-------------|:---:|
| Volle menschliche Vier-Themes-Runde nach jeder Welle | Wortlaut von GATE-05, aber fünfmal vier Themes von Hand | |
| Gezielte Stellenliste pro Welle | Weniger Aufwand, aber flächige Defekte entgehen | |
| Dreistufig: automatisch immer, menschlich voll nach 16/17/18 | Absenkung, ausdrücklich als Abweichung gebucht | ✓ |

**Claudes Wahl:** Dreistufig, mit Umformulierung von Erfolgskriterium 5 (D-53, D-54).
**Notizen:** Der Nutzer ist der Tester. Eine Abnahme, die er nicht durchhält, schützt nichts. Die
Absenkung wird gebucht und das Kriterium umformuliert — nicht stillschweigend unterlaufen. Der
Harness deckt Messbares ab (Kontrast, Tokenwerte, `color-scheme`, berechnete Größen); Urteile
bleiben menschlich.

**Geltungsbereich (GATE-04):** sechs Befundgruppen, drei mitgenommen (rgba mit echtem
Theme-Gewinn, font-size, die von TYPO-05 wörtlich verbotenen Gewichte), drei als datierte
Restschuld (`transition`/`box-shadow` außerhalb CSS — gemessen kommt `transition: all` dort **null**
mal vor; Hex-Literale; der fehlende Werkzeugleisten-Wächter). Sieben harte Ausnahmen, fünf davon
neu benannt (D-32, D-34).

---

## Mechanik-Blocker mit großer Reichweite

| Option | Beschreibung | Gewählt |
|--------|-------------|:---:|
| `color-mix` | Bereits etabliert (13 Nutzungen gegen 6) | ✓ |
| `--*-rgb`-Familie auf acht Akzente erweitern | Testgeschützt, aber Erweiterung eines Nebenwegs | |

**Claudes Wahl:** `color-mix`, die `-rgb`-Familie wird im selben Commit abgeräumt (D-27).
**Notizen:** Das Serialisierungsrisiko ist gemessen kleiner als behauptet: es gibt **genau ein**
`toHaveCSS` im gesamten E2E-Baum, nicht sieben. Die sieben rgba-Stellen in den eingefrorenen
Editor-Specs sind Zeichenkettenvergleiche auf das `style`-Attribut und von der Serialisierung
berechneter Farben nicht betroffen.

| Option | Beschreibung | Gewählt |
|--------|-------------|:---:|
| Goldener Rahmen gilt als Ringersatz | Welle schrumpft auf wenige Edits | ✓ |
| Alle 33 `:focus` auf `:focus-visible` umschreiben | Die eigentliche Arbeit — wäre hier unbegründet | |

**Claudes Wahl:** Ja, gilt als Ersatz (D-43).
**Notizen:** Gemessen tragen 27 der 33 Stellen einen goldenen Ersatz und 5 einen anderen
Akzentrahmen — wirklich ringlos ist **eine**. Die im Handoff vorgeschlagene `:where(…)`-Regel wäre
ohnehin Nullarbeit gewesen (Spezifität 0-1-0 gegen mindestens 0-2-0).

| Option | Beschreibung | Gewählt |
|--------|-------------|:---:|
| `--ease` als `cubic-bezier(0.2, 0, 0.2, 1)` | Ändert das Bewegungsgefühl der ganzen App | |
| `--ease` als `ease` einführen | Ein Token, unverändertes Gefühl | ✓ |

**Claudes Wahl:** Token einführen, Kurvenwert zurückstellen (D-39).
**Notizen:** MOTION-04 wäre eine app-weite Änderung, die in keinem der drei Handoff-Dokumente als
Folge benannt ist. Der Kurvenwechsel geht als eigener, sichtprüfungspflichtiger Punkt in die
zurückgestellten Ideen.

| Option | Beschreibung | Gewählt |
|--------|-------------|:---:|
| 500 → 400 | Handoff-Vorschlag, angeblich folgenlos unter Windows | |
| 500 → 600, Ausführung außerhalb v1.3 | Zielwert entschieden, Ausführung bleibt zurückgestellt | ✓ |

**Claudes Wahl:** Zielwert 600 (D-41).
**Notizen:** Die Handoff-Begründung ist widerlegt. Gemessen rendert `font-weight: 500` unter
Windows/Chromium mit dem echten UI-Stack **pixelidentisch wie 600**, nicht wie 400 — 500 → 400 wäre
also sichtbar gewesen, 500 → 600 ist es nicht. Die Ausführung bleibt bei TYPO-07 (zurückgestellt).

---

## Widersprüche zwischen den Clustern, hier aufgelöst

Elf Widersprüche entstanden, weil die acht Cluster parallel und blind füreinander liefen. Die
schwersten und ihre Auflösung:

| Widerspruch | Auflösung | Grundlage |
|---|---|---|
| rgba-Ausnahmeliste in drei unvereinbaren Fassungen (4 Einzelmarker · ganze Datei · 92 befristete Schatten) | Marker je Vorkommen, `variables.css` eingeschlossen, keine befristete Gruppe | Wenn `--elev-*` per `color-mix` über `--shadow-ink` gebildet wird, bleibt kein rgba-Literal in `variables.css` (D-28, D-29, D-35) |
| `.skeleton` löschen gegen behalten samt Test | Der ganze Block fällt, `core.css` bekommt einen neuen | `.skeleton` hat **null** Verwender — 12 von 12 Treffern liegen in `dmscreen.css` selbst (D-18) |
| `--elev-*` mit rgba-Literalen gegen `color-mix` | `color-mix` über `--shadow-ink` | Folgt aus der Mechanikwahl D-27 |
| `rgba(var(--green-rgb), …)` als Zielausdruck | Auf `color-mix` umgeschrieben | Die Tokenfamilie fällt in D-27 |
| Drei Baseline-Artefakte, drei Verfahren | Nur `15-RATCHET-BASELINE.md`, erhoben nach dem Löschlauf | Formvorbild `14-GATE-BASELINE.md` (D-26) |
| `INLINE_MAX` zweimal unabhängig auf 256 gesenkt | 257 → 256 (Phase 15) → 255 (Phase 19) | Zwei Senkungen, zwei Ratschenstände (D-51) |
| dms-Löschumfang: 9 ausnehmen gegen alle 62 ausnehmen | Keine Vorab-Liste; nach den FIX-Commits neu messen | Eine vorab fixierte Liste wäre ab dem ersten FIX-Commit falsch (D-25) |
| „Umfangsinhaber" nirgends benannt | Redaktionelle Nachführung ist benannte Arbeit der Phase 15 | Sonst hat die Phase Kriterien, die zur Abnahme weder erfüllt noch geändert sind (D-08) |
| BASE-03 von keinem Cluster geführt | Eigene Entscheidungen D-05, D-18, D-19 | Vollständigkeitskritik |

## Kennzahlen, die sich als falsch oder als Zählartvermischung erwiesen

- **„62 gegen 63 tote `dms-`Klassen"** — 62 ist richtig; die 63 entsteht nur durch Mitzählen des
  `@keyframes`-Namens `dms-live-pulse`, der überdies lebt.
- **„15 gegen 32 ungestylte `dms-`Klassen im JS"** — 15 ist richtig; die 32 zählt 16 `data-action`-Werte
  und Element-IDs mit, die per Konstruktion keine CSS-Regel haben dürfen.
- **„Playwright 354 gegen 344"** — beide richtig für ihre Frage: 344 Deklarationen, 354 ausgeführte
  Fälle; die Differenz von exakt 10 entsteht an drei `for`-Schleifen. Als Abnahmezahl taugt nur die
  ausgeführte.
- **„rgba: 390 / 394 / 375 / 371 / 400"** — vier saubere Zählarten plus eine nicht reproduzierbare.
  Verbindlich ist Vorkommen ohne `variables.css` = **390**, also die dokumentierte Zahl.
- **„173 rgba-Werte"** — zählt exakte Zeichenketten; normiert bleiben **143**. Die Differenz sind 30
  reine Schreibweisenvarianten. Wer daraus Tokenbedarf ableitet, plant 30 Tokens zu viel.
- **„`prefers-reduced-motion` bei `dmscreen.css:1408-1414`"** — an beiden Enden falsch; der Block
  läuft 1408-1419. Auch die kursierende Korrektur auf 1408-1414 war falsch.
- **„149 Hex-Literale außerhalb CSS"** — reproduzierbar nur als Mischung zweier Zählregeln; streng
  gemessen 148. Die naive Regex trifft deutsche HTML-Entities: 27 vermeintliche Treffer in
  `migration-wizard.js` und 15 in `view-bestiary.html` sind Umlaute.
- **„`IMPORTANT_MAX` ist gerissen, es sind 107"** — 105 gegen Grenze 105. Der Test misst auf
  kommentarfreiem CSS; 107 ist der Wert *mit* Kommentaren.
- **„`font-weight: 500` rendert unter Windows als 400"** — gemessen pixelidentisch wie **600**.
- **„`CLAUDE.md`: 13 modulare CSS-Dateien"** — gemessen 20.

## Claude's Discretion

Alle Entscheidungen dieser Sitzung, unter der Anweisung „Führe alle Bereiche nach deinen
Empfehlungen aus". Vier davon sind in CONTEXT.md zur ausdrücklichen Bestätigung markiert:
D-53 (weniger händische Abnahmerunden), D-43 (goldener Rahmen statt Fokusring),
D-39 (Bewegungsgefühl bleibt unverändert), D-41 (Gewicht 500 bleibt in v1.3 unangetastet).

## Deferred Ideas

Vollständig in CONTEXT.md `<deferred>`. Neu in dieser Sitzung entstanden: der fehlende
Werkzeugleisten-Wächtertest, die dritte Pip-Familie (`.init-slot-box`), `renderSpellSlotPips` als
toter JS-Code, die Trefferflächengröße für Touch, und die neun nach FIX-01 verbleibenden
ungestylten `dms-`Klassen.
