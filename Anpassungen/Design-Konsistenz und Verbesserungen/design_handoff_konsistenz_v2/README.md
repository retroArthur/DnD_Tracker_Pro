# Handoff: Design-Konsistenz — Welle 4 bis 6

## Auftrag in einem Satz
Die neun Befunde aus `BEFUNDE-v2.md` in den modularen Quelldateien von
`DnD_Tracker_App_Pro` beheben — beginnend mit den Farb- und Kontrastbefunden
(N-01 bis N-03), weil dort drei der vier Themes sichtbar falsch aussehen.

## Ausgangslage: das erste Audit ist fertig
Die 19 Befunde des ersten Audits (F-01 … F-19, siehe
`Anpassungen/Design-Konstanz prüfen und beheben/`) sind **umgesetzt und durch
Tests gegen Rückfall gesichert**. Nachgemessen am aktuellen Stand:

| geprüft | Ergebnis |
|---|---|
| `var(--x)` ohne Definition | 0 (nur die 3 Laufzeit-Tokens) |
| Hex-Literale im Komponenten-CSS | 0 (der einzige Treffer steht in einem Kommentar) |
| `border-radius` | 660 Angaben, alle aus der Dreier-Skala plus 50% / 999px |
| Breakpoints | genau 600 / 900 / 1200 |
| `rem` außerhalb der Schriftdefinitionen | 0 |
| globale `z-index`-Rohwerte | 0, siebenstufige Leiter |
| Ansichten mit Titelzeile | 24 von 24 |
| Master-Detail-Ketten | 1 (825 → 520 → 1fr) für 6 Ansichten |

**Dieser Handoff ist die Schicht darunter.** Was das erste Audit nicht erfasst
hat: Farbe in `rgba()`-Notation, Kontrast in den hellen Themes, Schatten,
Typo-Skala, Fokus und Bewegung.

## Was diese Dateien sind
* `BEFUNDE-v2.md` — der Auditbericht: 9 Befunde, je mit Messwert, Belegstelle
  und empfohlenem Fix. **Das ist die Aufgabenliste.**
* `PATCHES.md` — einsetzbare Code-Blöcke für N-01 bis N-06, mit Such-Anker
  statt Zeilennummer, plus die berechneten Farbwerte.
* `CHECKLISTE.md` — Abnahmekriterien, überprüfbar per `grep`, plus die
  Test-Ratschen, die jede Welle abschließen sollen.
* `Design-Konsistenz-Bericht v2.dc.html` — derselbe Bericht als lesbare Seite
  (Design-Referenz, kein Produktionscode). Braucht `support.js` daneben.

Erhoben am **08.09.2026** über `assets/styles/*.css` (21 Dateien, 27.187
Zeilen) und `assets/templates/*.html` (13 Dateien, 24 Ansichten). Keine
Laufzeitmessung, keine Screenshots — alle Zahlen sind statisch aus dem Quellstand.

## Arbeitsweise
1. **Nicht neu bauen.** Refactoring im Bestand, kein Redesign. Klassennamen,
   `data-action`/`data-render`/`data-value` und die JS-Delegation bleiben.
2. **In den Modulen ändern**, nicht im gebauten Bündel: `assets/styles/*.css`,
   `assets/templates/*.html`, `core/`, `features/`. Danach `python build.py`.
3. **Kein neuer Farb-, Schatten-, Größen- oder Dauerwert im Komponenten-CSS.**
   Alles Neue kommt als Token in `assets/styles/variables.css` und wird von
   dort referenziert — genauso wie die Radius- und Abstands-Skala aus Welle 3.
4. **Wellenweise, je Welle ein Commit.** Nach jeder Welle `CHECKLISTE.md`
   durchlaufen und die zugehörige Ratsche in
   `tests/unit/design-consistency.test.js` ergänzen.
5. **Funktion darf sich nicht ändern.** Kein Befund verlangt neue Funktionen;
   N-05 rüstet sichtbaren Tastaturfokus nach, das ist kein Funktionswechsel.
6. **Der Aliasblock in `variables.css` steht bewusst NACH den vier
   Theme-Blöcken** (Kommentar dort lesen). Neue Tokens, die einem Theme folgen
   sollen, gehören in die vier Theme-Blöcke; neue Tokens, die aus Basis-Tokens
   abgeleitet sind, in den Aliasblock.

## Reihenfolge

**Welle 4 — Farbe kommt in allen Themes an** (größter sichtbarer Effekt)
* N-02 — Schriftfarbe auf gefüllten Knöpfen + Light/Sepia-Akzente → `PATCHES.md` §1, §2
* N-01 — 390 `rgba()`-Literale auf `color-mix` / Overlay-Tokens → §3
* N-03 — 66 Schatten auf vier Höhenstufen → §4

**Welle 5 — Typografie und Tempo als Skala**
* N-04 — sieben Größenstufen, `em` raus → §5
* N-06 — drei Dauern, `transition: all` raus → §6
* N-07 — drei Schriftgewichte (BEFUNDE-v2 § N-07)

**Welle 6 — Bedienbarkeit ohne Maus** (kleinster Aufwand)
* N-05 — ein Fokusring für alles → §7
* N-08 — vollständiger `prefers-reduced-motion`-Block → §8
* N-09 — doppelter Zähler in der Zauber-Ansicht (BEFUNDE-v2 § N-09)

## Abnahme
Siehe `CHECKLISTE.md`. Kurzfassung: kein `rgba()` mit Zahlentripel im
Komponenten-CSS; jede Rolle erreicht in allen vier Themes 4,5:1 gegen
`--bg-card`; `box-shadow` nur aus den vier Höhen-Tokens; `font-size` nur aus
der Skala; kein `transition: all`; kein `outline: none` auf einem
`:focus-visible`-Selektor.

## Nicht Teil des Auftrags
Neue Features, Framework-Umstellung, Änderung der Datenhaltung, der
Navigationsstruktur oder der Emoji-Icons. Die begründeten Ausnahmen der Welle 3
bleiben, wie sie sind: die 65 `!important` in `.spell-desc *` (schlagen
Inline-Stile des Rich-Text-Editors), die bedeutungstragenden Farbskalen
(Schadensarten, Attribute, Warenkategorien, Wissensgebiete), die Vorlese-
Papierpalette und die Statblock-Pergamenttöne — alle vier sind bewusst
themenunabhängig, siehe Kommentare in `variables.css`.
