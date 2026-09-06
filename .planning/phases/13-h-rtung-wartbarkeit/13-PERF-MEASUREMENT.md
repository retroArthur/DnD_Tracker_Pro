# Phase 13 Plan 06 — Messprotokoll PERF-01 (Erfolgskriterium 2)

**Datum:** 2026-09-06
**Node-Version:** v24.14.0
**Hardware:** 16x AMD Ryzen 7 9850X3D 8-Core Processor           , 61.7 GB RAM

## Fixture

Synthetische, realistisch dimensionierte Kampagne (kein `window.D` — ein lokales Testobjekt
gleicher Form, ausschliesslich fuer diese Messung):

| Sammlung | Anzahl | Quelle |
|---|---|---|
| `characters` | 8 | vollstaendige Attribute, Zauberplaetze, Inventar |
| `npcs` | 120 | mit Beziehungen |
| `locations` | 60 | |
| `quests` | 80 | |
| `encounters` | 40 | |
| `spells` | 75 | `core/srd-spells.js` (`getSRDSpells()`, vollstaendiger Satz) |
| `bestiary` | 112 | `core/srd-monsters.js` (`getSRDMonsters()`, SRD 5.1 DE) |
| `wiki` | 200 | je ~2 KB Text |
| `sessionNotes` | 300 | |

Hinweis: `diceStats` ist laut Phase-12-Befund NICHT Teil von `D` (liegt in IndexedDB) und geht
folgerichtig nicht in diese Messung ein.

## Messwerte

| Messgroesse | Wert |
|---|---|
| Median `JSON.stringify(D)`-Dauer (20 Laeufe) | 0.946 ms |
| Stringlaenge (Zeichen) | 836.419 Zeichen |
| Stringgroesse (UTF-8-Bytes, `utf8ByteLength()`) | 838.213 Bytes (0.80 MB) |
| Undo-Stack-Gesamtgroesse bei 30 Eintraegen (kein Dedupe zwischen den Eintraegen) | 25.146.390 Bytes (23.98 MB) |
| Median `new Blob([s]).size`-Dauer (20 Laeufe, Referenz) | 14.544 ms |
| Median `utf8ByteLength(s)`-Dauer (20 Laeufe) | 1.127 ms |

*Hinweis zur Blob-Zeile:* gemessen in Jest/jsdom (Node v24.14.0), dessen `Blob`-Implementierung
eine reine JS-Nachbildung ist, kein natives Browser-`Blob`. Der absolute Faktor zwischen den
beiden letzten Zeilen ist deshalb ein Artefakt der Testumgebung, keine verlaessliche Aussage ueber
reale Chrome/Firefox-Laufzeiten. Der eigentliche Gewinn aus Task 1/2 ist nicht "schneller als
Blob", sondern "keine zweite Kopie mehr" — das gilt umgebungsunabhaengig.

## Abnahme Erfolgskriterium 2

Erfolgskriterium 2 verlangt, dass keine Kampagnen-Serialisierung im laufenden Betrieb spuerbar
Zeit kostet. Die gemessene Median-Dauer von `JSON.stringify(D)` liegt bei 0.946 ms
und damit im geforderten einstelligen Millisekundenbereich.

**Entscheidung: Erfolgskriterium 2 wird fuer den Save-Pfad als erfuellt, fuer den Undo-Pfad
als nachweislich unkritisch abgenommen.** Die in Task 1/2 entlastete Byte-Zaehlung entfernt die
zweite Vollkopie an beiden Save-Aufrufstellen; die verbleibende Redundanz (`JSON.stringify(D)`
laeuft bei jedem Undo-Push zusaetzlich zum naechsten Save erneut) bleibt bestehen, weil D-10 sie
bewusst nicht durch Scoping oder Delta-Snapshots aufloest — bei 0.946 ms pro Lauf
ist das am Spieltisch nicht wahrnehmbar, auch nicht bei mehreren Aktionen pro Sekunde. Die
Abweichung von der urspruenglichen Formulierung des Kriteriums ist damit gemessen statt vermutet
und bewusst benannt akzeptiert.

**Byte-Budget-Pruefung:** Bei 23.98 MB fuer den vollen 30-Eintraege-Undo-Stack
greift das in Task 2 gewaehlte Budget von 64 MB im gemessenen Normalfall NICHT — es bleibt ein reiner Ausreisser-Deckel, keine Korrektur noetig.

## Nachvollziehen an der eigenen Kampagne

Diese Fixture ist die automatisierte Referenz — die eigene, echte Kampagne ist die Wahrheit.
So misst man dieselben Werte in der laufenden App nach:

1. Browserkonsole oeffnen (F12), Tab "Konsole".
2. Eingeben:
   ```js
   const t0 = performance.now();
   const s = JSON.stringify(window.D);
   const t1 = performance.now();
   console.log('Dauer (ms):', t1 - t0);
   console.log('Zeichen:', s.length);
   console.log('UTF-8-Bytes:', window.utf8ByteLength(s));
   ```
3. Mehrfach ausfuehren (Pfeil-hoch in der Konsole) und den kleinsten/typischen Wert nehmen —
   der erste Lauf ist durch JIT-Aufwaermen oft langsamer als die folgenden.
