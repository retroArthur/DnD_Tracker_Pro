# Der Tastatur-Strang: Bericht

**Stand:** 13.10.2026, HEAD `ec67321` auf Zweig `tastatur-strang` · **Ausgangsstand:** `4e0d810` · **46 Commits**, 21 Dateien, +10.389 / −12
**Anlass:** der Posten, den der Design-Handoff ausdrücklich **nicht** als Designwelle führt — *„Tastatur-Erreichbarkeit ist ein eigener JS-Strang nach Welle 6"*

---

## 1 · Das Ergebnis

**Vier von sieben Handgriffen einer Kampfrunde waren ohne Maus nicht ausführbar. Jetzt sind es null.**

| Handgriff | vorher | nachher |
| --- | --- | --- |
| Initiative starten | **kein Weg** | 26 Anschläge |
| Zug weiter (Leertaste) | 1 | 1 |
| Zug zurück (Tabulator) | **kein Weg** — der Zug ging *vorwärts* | 22 |
| **Schaden eintragen** | **kein Weg** | **4** |
| Zustand setzen | **kein Weg** | 55 |
| Zauberplatz abstreichen | **kein Weg** | 43 |
| Todesretter schalten | **kein Weg** | 42 |
| Neue Runde (Tabulator) | **kein Weg** — die Runde blieb stehen | 23 |

Die vier Anschläge für Schaden sind die Zahl, die am Tisch zählt: `H`, Zahl, Tab, Enter. Vorher waren es **47 bis 189 Tabulatorsprünge**, je nachdem, der wievielte Kämpfer getroffen wird — und sie bleiben vier, unabhängig davon, wie viele Kämpfer in der Initiative stehen.

---

## 2 · Der Fehler, der heute schon da war

**Die Leertaste war gekapert.** Wer in der Initiative-Ansicht auf „◀ Zurück" tabulierte und die Leertaste drückte, schaltete den Zug **vorwärts**. Der Kampf war eine Runde falsch, und nichts auf dem Schirm sagte warum.

Gemessen am Ausgangsstand: von 88 Tastaturhalten waren **82 gekapert**, 81 davon echte `<button>`. Betroffen waren alle Einzeltasten-Kürzel — Leertaste, `r`, `n`, `p`, `t`, `l`, `k`, `/`, Ziffern, `Shift+N` —, weil die Schranke nur `INPUT`, `TEXTAREA`, `SELECT` und `contentEditable` ausnahm.

Die Korrektur ist **eine Quelldatei, sechs Zeilen Wirkung**: ein zweiter Begriff neben `isTyping`, der prüft, ob das fokussierte Element die Taste selbst beansprucht. Es wird nichts nachgebildet — kein synthetisches `click()`, kein `preventDefault()`. Die Schranke lässt die Taste nur durch, und der Browser löst den Knopf selbst aus.

**Die Zahl aus meiner Vorgabe stimmte nicht.** Ich hatte „29 von 34" genannt; nachstellen ließ sich das bei keiner Kampagnengröße — es waren 50/56, 82/88 und 69 der ersten 70. Der Agent hat die Regel dahinter benannt, statt eine Zahl zu verteidigen: gekapert war *alles außer den Formularfeldern*.

---

## 3 · Was sonst gebaut wurde

**Der `keydown`-Zweig** im Ereignis-Verteiler: Enter und Leertaste bedienen, was unter dem Fokus steht — genau einmal, ohne dass die Seite wegrollt.

**Die Nachrüstung der fünf Kampfansichten:** unerreichbare Bedienelemente 12/8/9/1/1 → **0/0/0/0/0**; über alle 24 Ansichten 131 → 72. Per `tabindex="0"` + `role="button"`, nicht durch Umbau zu `<button>` — ein `<button>` bringt eigene Vorgaben mit, und `display` und `textAlign` sind zwei der zwölf Eigenschaften, die der Stil-Sollstand hasht.

**Die Modale:** der Fokus landet beim Öffnen in **36 von 36** Schalen innen (vorher 2), bleibt bei 45 Sprüngen in 36 von 36 drin (vorher 0), und kehrt nach Escape in 36 von 36 auf den Öffner zurück (vorher 0).

Die dritte Zahl ist die, auf die es ankommt: vorher landeten **1.333 bis 1.606 von 1.396–1.610 Sprüngen** auf Zielen *unter* der Dialogfläche — unsichtbar, aber auslösbar. Man drückte blind auf etwas, das man nicht sah, während man Schaden eintrug.

**Das Kürzel `H`** öffnet den Lebenspunkte-Rechner auf dem Kämpfer am Zug. Die Taste wurde gemessen gewählt, nicht geraten: von 68 Kandidaten sind 17 in der Initiative-Ansicht belegt, 51 frei; `h` passt zur eigenen Wortwahl der App (`title="HP ändern"`, „❤️ HP").

---

## 4 · Was die Prüfung besser gemacht hat als mein Auftrag

**Der Doppelauslösungs-Beleg brauchte zwei Hälften.** „▶ Nächster" trägt `data-action="call"` mit `data-value="nextTurn"`; ein Zähler an `window.nextTurn` zählt dort mit, obwohl alles richtig läuft. Ein naiver Diskriminator hätte Fehlalarm geschlagen. Belegt sind jetzt **17 von 17 Aktionsarten mit genau einem `click` am Ziel**, davon sechs nicht-idempotente an ihrer Wirkungsgröße geprüft (Zug ±1, Runde +1, Kämpfer −1, Beute −1, Schaden 40→39).

**Die Kürzel-Messung war in der ersten Runde falsch.** Sie las nur Wirkungsgrößen und meldete `Strg+K` und `Strg+F` als „frei" — beide setzen aber nur den Fokus. Korrigiert und um den Fokus erweitert: **44 Tasten einzeln an beiden Ständen, 43 wirkungsgleich, 0 verloren, 1 neu belegt.**

**Eine Selbstkorrektur in T-A:** die erste Fassung der Schranke machte auch die **Ziffern 1–9 nach einem Knopfklick tot**. Rot bewiesen, dann eingeengt — die Schranke gilt jetzt nur der Leertaste.

---

## 5 · Alle Tore, von mir unabhängig nachgefahren

| | vorher (`4e0d810`) | jetzt (`ec67321`) |
| --- | --- | --- |
| Jest | 2.137 (78 Suiten) | **2.250 (81 Suiten)** |
| Playwright | 634 / 39 übersprungen | **728 / 47 / 0 Fehlschläge** |
| pytest | 30 | 30 |
| Lint | 363 = Pin | 363 = Pin |
| Typecheck / strict | grün | grün |
| Builds | grün | grün |
| DUBLETTEN / `!important` / Inline | 0 / 104 / 251 | **unverändert** |
| beide Wächter | OK | OK |

**Keine Ratsche hat sich bewegt** — in diesem Strang ist keine Zeile CSS angefasst (`git diff -- assets/styles/` ist leer). Der Stil-Sollstand ist unberührt: `tabindex` und `role` ändern keinen der zwölf gehashten Werte.

Die +113 Jest-Fälle liegen vollständig in drei neuen Dateien (38 + 30 + 45); keine Bestandsdatei hat einen Fall dazubekommen. Die +94 E2E-Fälle in fünf Verhaltensdateien.

**Zwei flaky in meinem Lauf:** die beiden `eingaberahmen`-Fälle aus Welle 6, die die Abnahme als lastabhängig gemeldet hatte. Bei mir fielen sie einmal und liefen beim Wiederholen durch — das bestätigt die Diagnose. Die Abnahme meldete 732 bestanden, ich 728; die Differenz von vier kann ich nicht erklären. Beide Läufe: exit 0, null Fehlschläge, übersprungene identisch.

---

## 6 · Offen

1. **Der Konzentrations-Dialog** — nach drei Prüfrunden offen: der Fokus kehrt dort nicht zum Öffner zurück, weil der Öffner nach dem Schließen nicht mehr existiert. 143 echte Tabulatorsprünge bei 20 Kämpfern.
2. **Die 19 Ansichten der Vorbereitung** — 145 der 462 Stellen. Nach deiner Entscheidung „Kampf zuerst" bewusst nicht in diesem Paket; die Mechanik dafür steht jetzt.
3. **Die 19 Beute-Marken** hinter `display: none` und die **199 ungebundenen Beschriftungen**.
4. **Die verbleibenden Phantom-Halte.**

**Nicht gepusht.** Der Zweig liegt lokal; PR #3 und PR #4 sind davon unberührt.

---

## 7 · Nachkontrolle

Die Probe ist eine Kampfrunde ohne Maus. Finger weg von Maus und Trackpad, dann:

1. Initiative öffnen, mit Tab zu „+ Party" und „Alle würfeln".
2. Leertaste — Zug weiter. Dann mit Tab auf **„◀ Zurück"** und Leertaste: **geht der Zug jetzt zurück?** Das war der Fehler.
3. `H` drücken — öffnet sich der Lebenspunkte-Rechner auf dem Kämpfer am Zug? Zahl eintippen, Tab, Enter.
4. Ein Modal öffnen und **nur Tab drücken**, zwanzigmal. Bleibt der Fokus im Dialog? Dann Escape — landet er wieder auf dem Knopf, der es geöffnet hat?
5. Einen Zauberplatz-Punkt ansteuern: ein Tabulatorhalt auf die Reihe, dann mit **Links/Rechts** darin laufen und mit der Leertaste schalten.

Und die Gegenprobe, die genauso zählt: **mit der Maus ändert sich nichts.** Wer klickt statt tabuliert, soll von dieser Arbeit nichts merken.
