# Phase 14 Plan 01 — Gate-Baseline-Messprotokoll

**Datum:** 2026-09-07
**Node-Version:** siehe `node --version` zum Messzeitpunkt (v24.x, wie in `13-PERF-MEASUREMENT.md`)
**Voraussetzung:** Task 1 dieses Plans (D-07, `eslint-disable-next-line` in `systems/avatars.js`) ist
zum Messzeitpunkt bereits committet — alle Zahlen unten sind der Stand **nach** D-07, nicht davor.

> Diese Datei ist die eingecheckte Grundlage, auf die die Ratschen der Pläne 14-06 (Lint),
> 14-07 (Typecheck), 14-08 (Coverage/`roots`) und 14-09 (Modul-zu-Test-Gate) gepinnt werden.
> Jede Zahl unten wurde in dieser Sitzung frisch gegen den Live-Baum erhoben — keine Zahl aus
> `14-CONTEXT.md` oder `14-RESEARCH.md` wurde übernommen. Wo sie abweichen, stehen beide Werte
> nebeneinander und diese Messung ist die maßgebliche.

## Messblock 1 — Lint-Reststand nach D-07

**Befehl:** `npx eslint . --format json` (Ausgabe in eine temporäre, nicht eingecheckte Datei
umgeleitet und ausgewertet)

| Kennzahl | Wert |
|---|---|
| Gesamtfehler | **0** |
| Gesamtwarnungen | **2196** |
| `no-undef`-Vorkommen | **1829** |
| `no-undef`-eindeutige Namen | **539** |
| Warnungen ohne `no-undef` (Kandidat für `--max-warnings`, D-10) | **367** |

**Aufschlüsselung nach `ruleId` (absteigend):**

| Regel | Anzahl |
|---|---|
| `no-undef` | 1829 |
| `no-unused-vars` | 336 |
| `no-misleading-character-class` | 11 |
| `no-useless-escape` | 8 |
| (kein `ruleId` — unbenutzte `eslint-disable`-Direktiven) | 8 |
| `no-empty` | 4 |

**Interpretation:** Der rote Fehler aus Task 1 ist weg — `npx eslint .` läuft mit Exit 0. Die
Warnungszahl (2196) ist gegenüber dem Vor-D-07-Stand unverändert, wie von der Aufgabenstellung
gefordert. Die 367 Nicht-`no-undef`-Warnungen (336+11+8+8+4 = 367, exakte Summe, keine Rundung)
sind der künftige `--max-warnings`-Startwert für D-10, sobald D-08 `no-undef` auf `error` hebt.

### Nachtrag (Plan 14-06, Task 3) — Ratsche gepinnt

**Datum:** 2026-09-07 (nach Task 1/2 von Plan 14-06: sieben D-09-Fundstellen behoben,
`no-undef: error`)

**Befehl:** `npx eslint . --format json`, ausgewertet nach `severity`.

| Kennzahl | Wert |
|---|---|
| Fehler | **0** |
| Warnungen gesamt | **367** |
| `no-unused-vars` | 336 |
| `no-misleading-character-class` | 11 |
| (kein `ruleId` — unbenutzte `eslint-disable`-Direktiven) | 8 |
| `no-useless-escape` | 8 |
| `no-empty` | 4 |

Die Zahl ist identisch mit dem in Messblock 1 erhobenen Nicht-`no-undef`-Reststand (367) — nach
D-07 sind keine weiteren Warnungen hinzugekommen oder verschwunden, `no-undef` ist jetzt 0 statt
1829, weil es ein Fehler ist, kein Warnungs-Ruleid mehr.

`package.json`s `lint`-Skript ist auf `eslint . --max-warnings 367` gepinnt. Beidseitig geprüft:
`npm run lint` → Exit 0; `npx eslint . --max-warnings 366` → Exit 1. `lint:all` ist aus
`package.json` entfernt; kein Skript und keine CI-Konfiguration referenzieren es noch.

## Messblock 2 — `tsc --checkJs`-Erhebung

**Befehl:**
```jsonc
// tsconfig.checkjs-probe.json — extends ./tsconfig.json, überschreibt drei Felder
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "checkJs": true, "noEmit": true, "emitDeclarationOnly": false }
}
```
```bash
npx tsc -p tsconfig.checkjs-probe.json
```
Die Probe-Konfiguration wurde nach der Messung wieder gelöscht (nicht eingecheckt).

| Kennzahl | Wert |
|---|---|
| Gesamtfehler | **1758** |
| Geprüfte Dateien insgesamt (`core/features/ui/utils/systems/render`, `.js`, ohne `.test.js`) | **134** |
| Dateien mit mindestens einem Fehler | **117** |
| Fehlerfreie Dateien | **17** |

**Aufschlüsselung nach TS-Code (absteigend):**

| Code | Anzahl |
|---|---|
| TS2339 (Property does not exist) | 1616 |
| TS2345 | 40 |
| TS2551 (did you mean) | 23 |
| TS2538 | 21 |
| TS2451 | 12 |
| TS2322 | 12 |
| TS2304 (Cannot find name) | 8 |
| TS2349 | 6 |
| TS2300 | 5 |
| TS2554 | 5 |
| TS1005 | 3 |
| TS2367 | 3 |
| TS2552 | 2 |
| TS8024 | 1 |
| TS2769 | 1 |

**Vollständige alphabetische Liste der 17 fehlerfreien Dateien** (Eingang für 14-07s
`tsconfig.strict.json`-`include`-Startliste):
```
core/srd-monsters.js
core/srd-spells.js
core/themes.js
features/dmscreen/dmscreen-widgets-combat.js
features/dmscreen/dmscreen-widgets-reference.js
features/initiative-statblock.js
features/npcs/npc-popup.js
systems/session-timer.js
systems/spellslots/notes-templates.js
systems/spellslots/pwa-install.js
systems/spellslots/spell-slots-core.js
systems/spellslots/spellslots-ui.js
systems/spellslots/virtual-list.js
systems/wiki-links.js
ui/actions/wiki-actions.js
ui/layout-profiles.js
utils/testable-utils.js
```

**Interpretation:** `14-CONTEXT.md` nennt 1617 Fehler über 98/103 geprüfte Dateien;
`14-RESEARCH.md`s Re-Verifikation maß **1758 Fehler über 117/134 Dateien** — exakt die Zahl, die
diese Messung erneut reproduziert. Die CONTEXT.md-Zahl bleibt nicht nachvollziehbar (ihr
Dateisatz von 103 ist kleiner als der volle `include`-Satz von 134 Dateien). Diese Messung setzt
**1758/117/134** als maßgeblich (siehe „Offene Divergenzen" unten) — dieselbe Zahl, die
`14-RESEARCH.md` bereits als Re-Verifikation dokumentiert.

## Messblock 3 — Coverage vor und nach dem `roots`-Fix

**Befehl A (heutiger Stand, `jest.config.cjs` unverändert):** `npx jest --coverage`

| Kennzahl | Wert |
|---|---|
| Suiten / Tests | 43 / 1109 |
| Instrumentierte Module | 2 von 134 (`core/srd-monsters.js`, `utils/testable-utils.js`) |
| Statements gedeckt/gesamt | 147/159 (92,45 %) |
| Branches | 126/142 (88,73 %) |
| Functions | 26/26 (100 %) |
| Lines | 124/131 (94,65 %) |

**Befehl B (Ad-hoc-Override, `jest.config.cjs` NICHT angefasst):** `npx jest --coverage --roots=.`

| Kennzahl | Wert |
|---|---|
| Suiten / Tests | 43 / 1109 (unverändert — kein Test-Explosionsrisiko durch breiteren `roots`) |
| Statements gedeckt/gesamt | 147/18950 (**0,77 %**) |
| Branches | 126/14845 (**0,84 %**) |
| Functions | 26/2816 (**0,92 %**) |
| Lines | 124/16800 (**0,73 %**) |

**`utils/testable-utils.js` — vier getrennte Einzelwerte** (Zielwerte für D-14, aus beiden Läufen
identisch, da die Datei in Lauf A bereits instrumentiert war):

| Statements | Branches | Functions | Lines |
|---|---|---|---|
| 92,81 % | 89,28 % | 100 % | 94,44 % |

**Interpretation:** `roots: ['<rootDir>/tests']` verhindert bislang, dass Jest die in
`collectCoverageFrom` gelisteten Quellverzeichnisse überhaupt durchsucht. Mit `--roots=.` bleibt
die Testzahl exakt gleich (43/1109) — die Sorge vor ungewollt neu erkannten Testdateien ist für
dieses Projekt unbegründet. Die ehrliche Statement-Coverage-Zahl nach dem Fix ist **0,77 %**, nicht
die heute berichteten 92,45 % (die sich nur auf 159 von 18950 möglichen Statements beziehen).

## Messblock 4 — Modul-zu-Test-Abdeckung

**Verfahren:** Die 134 Einträge aus `loader.js MODULES` wurden gegen jede Datei unter `tests/`
(rekursiv, Unit + E2E) für drei Kriterien geprüft:
- **(a)** der `loader.js`-relative Pfad (z. B. `features/timeline/timeline-render.js`) kommt
  wörtlich in mindestens einer Testdatei vor
- **(b)** der Basisname ohne `.js` (z. B. `timeline-render`) kommt als Teilzeichenkette vor
- **(c)** der Basisname mit Wortgrenzen (`\bname\b`) kommt vor

| Kriterium | Module OHNE jede Testerwähnung |
|---|---|
| (a) wörtlicher relativer Pfad | **78 von 134** |
| (b) Basisname als Teilzeichenkette | **62 von 134** |
| (c) Basisname mit Wortgrenzen | **62 von 134** |

Die Mengen unter (b) und (c) sind für diesen Codebase **identisch** (62 Module, exakt dieselbe
Liste) — Wortgrenzen ändern hier nichts gegenüber reinem Substring-Match. Kriterium (a) ist
strenger (78 statt 62), weil kein Testfile den relativen Pfad selbst zitiert (die 30
`vm`+`readFileSync`-Ladepfade laden über eigene, unterschiedlich aufgebaute relative Pfade, nicht
über den `loader.js`-Pfad wörtlich).

**Die elf Welt-Module** (`features/session-prep/`, `features/npc-generator/`, `features/timeline/`,
`features/reise/`, `features/fraktionen/`) unter (a) und (c):

| Modul | (a) wörtlicher Pfad | (c) Basisname (Wortgrenzen) |
|---|---|---|
| `features/session-prep/session-prep-render.js` | nein | nein |
| `features/session-prep/session-prep-crud.js` | nein | nein |
| `features/npc-generator/npc-default-tables.js` | nein | nein |
| `features/npc-generator/npc-generator.js` | nein | **ja** (siehe Hinweis unten) |
| `features/timeline/timeline-render.js` | nein | nein |
| `features/timeline/timeline-crud.js` | nein | nein |
| `features/reise/reise-default-tables.js` | nein | nein |
| `features/reise/reise-render.js` | nein | nein |
| `features/reise/reise-crud.js` | nein | nein |
| `features/fraktionen/fraktionen-render.js` | nein | nein |
| `features/fraktionen/fraktionen-crud.js` | nein | nein |

**Hinweis zum einzigen „ja" (`npc-generator.js` unter (c)):** Der Treffer ist ein Falsch-Positiv
gegen Kriterium (c) — `tests/e2e/features/welt-story.spec.js` erwähnt wiederholt den
`data-action="show-npc-generator"` und das DOM-Element `#npc-generator-modal`, nicht das Modul
`features/npc-generator/npc-generator.js` selbst. Der Basisname `npc-generator` fällt zufällig mit
dem UI-Bezeichner zusammen. Das ist genau der Grund, den `14-CONTEXT.md` für die Präzisierungs-
Pflicht vor D-13 nennt: ein zu grobes Kriterium zählt Zufallstreffer als Abdeckung.

**Interpretation:** Alle elf Welt-Module stehen heute unter Kriterium (a) UND (c) — bis auf den
einen dokumentierten Falsch-Positiv — ohne jede echte Testerwähnung; `welt-story.test.js` bildet
ihre Logik über lokal reimplementierte Funktionen nach (z. B. `anpassenRufInline()` statt
`anpassenRuf()`), nicht über einen Aufruf der Produktionsfunktion. Nach der Aufteilung durch
Plan 14-04 verlassen diese elf Module die künftige Ausnahmeliste aus D-13 nur, wenn die neuen
dedizierten Dateien tatsächlich Modulpfad oder Funktionsnamen zitieren — reines Verschieben allein
genügt nicht, wenn D-13s Kriteriumswahl (a) oder (b)/(c) verwendet.

### Nachtrag (Plan 14-09, Task 1) — Modul-zu-Test-Kriterium präzisiert, Basislinie nach der Aufteilung neu erhoben

**Datum:** 2026-09-07 (nach Abschluss der Pläne 14-04 und 14-05 — beide Sammeldateien sind
aufgeteilt, `tests/unit/welt-story.test.js` und `tests/e2e/features/welt-story.spec.js` existieren
nicht mehr, Stand 48 Suiten / 1112 Unit-Tests plus die aufgeteilten E2E-Specs).

**Kriteriumsentscheidung:** Das Gate in `tests/unit/module-test-coverage.test.js` verwendet
Kriterium (a) — der `loader.js`-relative Pfad muss wörtlich in mindestens einer Datei unter
`tests/` vorkommen — und **nicht** das kürzere Basisnamen-Kriterium (b)/(c). Beide Zahlen wurden
frisch gegen den Live-Baum nach der Aufteilung erhoben, per rekursivem String-Abgleich über alle
Dateien unter `tests/`, mit auf Schrägstriche normalisierten Pfadtrennern:

| Kriterium | Module OHNE jede Testerwähnung (nach der Aufteilung) |
|---|---|
| (a) wörtlicher relativer Pfad | **78 von 134** |
| (b) Basisname als Teilzeichenkette | **62 von 134** |

Beide Zahlen sind **identisch** mit der Vormessung in Messblock 4 (vor der Aufteilung). Das ist
kein Messfehler, sondern die direkte Bestätigung des dortigen Befunds: die Aufteilung aus
14-04/14-05 war mechanisch und verhaltensneutral (D-05) — die fünf neuen Unit- und fünf neuen
E2E-Dateien je Welt-Bereich übernehmen die `describe`-Blöcke wörtlich, ohne Modulpfade oder
Funktionsnamen der Produktionsdateien zu zitieren. Die elf Welt-Module verlassen die
Ausnahmeliste durch die Aufteilung deshalb **nicht** — genau wie in Messblock 4 und in
`14-05-SUMMARY.md` bereits vorhergesagt.

**Begründung der Kriteriumswahl (Pfad statt Basisname), mit Beleg:** Das Basisnamen-Kriterium
(b) erzeugt einen dokumentierten Falsch-Positiv: `features/npc-generator/npc-generator.js` gilt
unter (c) (Wortgrenzen-Variante von (b)) als "abgedeckt", weil `welt-story.spec.js` — jetzt
`tests/e2e/features/npc-generator.spec.js` — wiederholt den `data-action="show-npc-generator"`
und `#npc-generator-modal` erwähnt, nicht das Modul selbst. Ein Test, der nie eine Zeile
Produktionscode aus `npc-generator.js` liest, würde unter (b)/(c) fälschlich als Beweis für
Abdeckung zählen. Das Pfad-Kriterium (a) fällt nicht auf diesen Zufallstreffer herein — und genau
deshalb fällt die Wahl auf (a), obwohl es mit 78 statt 62 die längere, strengere Ausnahmeliste
ergibt. Eine falsche Abdeckungs-Zusicherung nimmt ein Modul dauerhaft und unsichtbar aus dem Gate
heraus; eine längere, datierte Liste ist sichtbar und schrumpfbar (D-13). Beide Zahlen stehen hier
nebeneinander, damit die Wahl nachvollziehbar bleibt, nicht nur behauptet ist.

Die vollständige, alphabetisch sortierte 78-Modul-Ausnahmeliste unter Kriterium (a) ist als
`MODULE_TEST_EXCEPTIONS` in `tests/unit/module-test-coverage.test.js` eingecheckt (Erhebungsdatum
im dortigen Kopfkommentar). Sie ist eine Obermenge der elf Welt-Module aus Messblock 4 — die
übrigen 67 Einträge sind Module, die auch vor jeder Welt-Feature-Arbeit nie testerwähnt waren
(z. B. `features/dice/dice-core.js`, `systems/session-timer.js`, `ui/dom-builder.js`).

## Messblock 5 — Testsummen der beiden Sammeldateien

| Datei | Befehl | Ergebnis |
|---|---|---|
| `tests/unit/welt-story.test.js` | `npx jest tests/unit/welt-story.test.js` | **37 Tests, 1 Suite, alle bestanden** |
| `tests/e2e/features/welt-story.spec.js` | `npx playwright test tests/e2e/features/welt-story.spec.js --list` | **26 Tests in 1 Datei** (Listung, kein Seitenaufruf — `build.py` nicht nötig) |

**Interpretation:** Beide Zahlen sind die binären Abnahmewerte für D-05 in den Plänen 14-04/14-05 —
die Aufteilung in je fünf dedizierte Dateien muss exakt 37 Unit- und 26 E2E-Tests ergeben, nicht
mehr und nicht weniger.

## Offene Divergenzen

**`tsc --checkJs`-Fehlerzahl:** `14-CONTEXT.md` nennt 1617 Fehler über 98 von 103 geprüften
Dateien; `14-RESEARCH.md`s Re-Verifikation (und diese Messung, unabhängig wiederholt) ergeben
**1758 Fehler über 117 von 134 Dateien**. Der Nenner 103 aus CONTEXT.md ist kleiner als die
tatsächliche Gesamtzahl von 134 `.js`-Quelldateien unter den sechs `include`-Verzeichnissen
(`core/features/ui/utils/systems/render`) — diese Messung zählt dieselben 134 Dateien wie
`loader.js MODULES` und `jest.config.cjs`s `collectCoverageFrom`, unabhängig per Verzeichnis-Walk
bestätigt. **Diese Messung setzt 1758/117/134 als maßgeblich** — sie ist reproduzierbar mit dem
oben dokumentierten Befehl und stimmt mit der unabhängigen Re-Verifikation aus `14-RESEARCH.md`
exakt überein, während der CONTEXT.md-Dateisatz (103) mit den in dieser Sitzung verfügbaren
Informationen nicht rekonstruierbar ist.

**`vm`-Ladepfad-Zahl (28 vs. 30 von 40 Unit-Testdateien):** `14-CONTEXT.md` nennt „30 von 40";
`14-RESEARCH.md`s Re-Verifikation zählt **28 von 40** (`grep -l "vm.createContext\|vm.runInContext"
tests/unit/*.test.js`). Diese Zahl fließt in dieses Protokoll nicht direkt in eine Ratsche ein
(D-13 verwendet stattdessen das Modul-zu-Test-Kriterium aus Messblock 4), wird aber der
Vollständigkeit halber mit aufgelöst: **diese Messung setzt 28 als maßgeblich** — die
projektinterne Praxis ist grundsätzlich, jede Zahl gegen den Live-Baum nachzurechnen statt aus
einem älteren Dokument zu übernehmen, und der `grep`-Befehl ist exakt reproduzierbar.

## Coverage nach dem roots-Fix (Plan 14-08, Task 1)

**Datum:** 2026-09-07
**Änderung:** `roots: ['<rootDir>/tests']` → `roots: ['<rootDir>']` in `jest.config.cjs`.
`testMatch`, `testPathIgnorePatterns` und `collectCoverageFrom` sind dabei unverändert geblieben
(per `git diff --unified=0 jest.config.cjs | grep -c '^-.*collectCoverageFrom\|^-.*testMatch'` →
`0` bestätigt).

**Testerkennung unverändert:** `npx jest` meldet vor und nach der Änderung identisch
**48 Suiten / 1112 Tests** (Stand nach Plan 14-06, siehe `14-06-SUMMARY.md`) — der breitere
`roots`-Wert sammelt keine zusätzlichen Testdateien ein. Bestätigt zusätzlich per
`find . -name "*.test.js" -not -path "./node_modules/*" -not -path "./tests/*" -not -path "./dist/*"`
→ keine Treffer außerhalb von `tests/`.

**Befehl:** `npx jest --coverage`

| Kennzahl | Wert |
|---|---|
| Suiten / Tests | 48 / 1112 (unverändert) |
| Instrumentierte Dateien in der Coverage-Tabelle | **125** (zuvor 2) |
| Statements gedeckt/gesamt | 147/18942 (**0,77 %**) |
| Branches | 126/14843 (**0,84 %**) |
| Functions | 26/2811 (**0,92 %**) |
| Lines | 124/16793 (**0,73 %**) |

**`utils/testable-utils.js` — vier Einzelwerte (unverändert gegenüber der Vormessung in Plan 14-01,
da die Datei bereits vorher instrumentiert war):**

| Statements | Branches | Functions | Lines |
|---|---|---|---|
| 92,81 % | 89,28 % | 100 % | 94,44 % |

**Einordnung, warum die Gesamtzahl so niedrig ist:** `collectCoverageFrom` erfasst jetzt
tatsächlich die fünf Quellverzeichnisse (`core/`, `features/`, `systems/`, `ui/`, `render/`) plus
`utils/testable-utils.js` — 125 von rund 134 `loader.js`-Modulen erscheinen in der Tabelle
(einige `.d.ts`/Test-Ausschlüsse greifen). Der überwiegende Teil der Unit-Tests in diesem Projekt
lädt Produktionscode nicht über den regulären Jest-Modul-Ladepfad, sondern über einen eigenen
`vm.createContext`/`readFileSync`-Ausführungskontext (siehe Messblock 4/`14-RESEARCH.md`) — an
diesen Ausführungspfad kommt Istanbuls Instrumentierung strukturell nicht heran, weil der Code
dort nie durch `require()`/den transformierten Jest-Modulgraphen läuft. Ein weiterer Teil der
Tests prüft Quelltext als reinen Text (`readFileSync` + String-/Regex-Assertions auf den
Dateiinhalt, etwa Konventions- oder Muster-Prüfungen) und kann per Konstruktion keine
Statement-Coverage erzeugen, weil der Code dabei nie ausgeführt wird. Die Zahl **0,77 %
Statement-Coverage gesamt** ist deshalb die ehrliche Zahl für diese Architektur — sie wird hier
dokumentiert und bewusst nicht als projektweite Schwelle verwendet (siehe D-13/D-14 in
`14-CONTEXT.md`: die einzige aussagekräftige Schwelle bleibt auf `utils/testable-utils.js`
begrenzt, die einzige Datei, die über den regulären Ladepfad läuft).

`collectCoverageFrom` wurde dabei nicht gekürzt — die volle Liste der fünf Quellverzeichnisse
bleibt bestehen, die Zahl ist absichtlich nicht durch einen engeren Nenner beschönigt.

## Offener Restposten DEBT-01 (Plan 14-07)

**Datum:** 2026-09-07
**Ausgangsmessung (Messblock 2, wiederholt in Plan 14-07 Task 1):** `checkJs: true` gegen den
vollen `include`-Satz der Basiskonfiguration (134 `.js`-Dateien über
`core/features/ui/utils/systems/render`) ergibt **1751 Fehler über 117 von 134 Dateien**
(Neumessung nach den `no-undef`-Fixes aus Plan 14-06; die vorherige Messung in Messblock 2 dieses
Protokolls, vor 14-06, ergab 1758/117/134 — die Differenz von 7 Fehlern entspricht exakt den
sieben in 14-06 behobenen Referenzen).

**Aufschlüsselung nach TS-Code (Neumessung, absteigend):**

| Code | Anzahl |
|---|---|
| TS2339 (Property does not exist) | 1616 |
| TS2345 | 40 |
| TS2551 (did you mean) | 23 |
| TS2538 | 21 |
| TS2451 | 12 |
| TS2322 | 12 |
| TS2349 | 6 |
| TS2554 | 5 |
| TS2300 | 5 |
| TS2367 | 3 |
| TS2304 (Cannot find name) | 3 |
| TS1005 | 3 |
| TS8024 | 1 |
| TS2769 | 1 |

Der weit überwiegende Anteil (1616 von 1751, ~92%) ist `TS2339` — „Property does not exist on
type Window & typeof globalThis" bzw. auf `AppData`/`Settings`. Das ist exakt das im Objective
benannte `window.X`/`D.X`-Zugriffsmuster dieser Architektur: globale Funktionen und das zentrale
`D`-Datenobjekt sind für TypeScript nicht typisiert, jeder Zugriff über `window.` oder auf ein
Feld von `D` erzeugt einen Fehler. Dieser Anteil bleibt außerhalb des Milestone-Scopes (siehe
Objective: „dessen Umbau ausdrücklich außerhalb dieses Milestones liegt").

**Zugelassene Dateien gegenüber Gesamtzahl:** **8 von 134** Dateien im `include`-Satz der
Basiskonfiguration stehen in `tsconfig.strict.json` (0 Fehler unter `checkJs`, gemessen gegen die
tatsächlich schmale `include`-Menge — nicht die 17 aus der ersten Messstufe, siehe Begründung
unten).

**Warum 8 und nicht die anfangs gemessenen 17:** Die Kandidatenmenge wurde zunächst wie in
Messblock 2 gegen den *vollen* 134-Datei-Kontext gemessen (17 fehlerfreie Kandidaten, identisch
mit der Liste in Messblock 2). Eine zweite Probe — dieselbe Kandidatenmenge NUR für sich
genommen als `include`, exakt die Konfiguration, die `tsconfig.strict.json` tatsächlich verwendet
— deckte auf, dass 9 dieser 17 Dateien auf globale Symbole verweisen, die von *anderen*,
ausgeschlossenen Dateien deklariert werden (`EntityLookup` aus `render/helpers.js`, `StorageAPI`,
über 20 Wiki-Aktionsfunktionen aus `features/wiki/`, mehrere `window.render*`-Funktionen aus
`features/initiative.js`/`features/bestiary/`). In dieser Non-ESM-Script-Architektur (siehe
CLAUDE.md, „Global Namespace") sind Top-Level-Deklarationen jeder kompilierten Datei Teil
desselben globalen Scopes; eine schmalere `include`-Menge verliert diesen Kontext ersatzlos. Das
ist kein Fehler dieser neun Dateien, sondern ein Artefakt des verkleinerten Kompilations-Scopes —
dieselben neun Dateien sind unter dem vollen 134-Datei-Kontext weiterhin fehlerfrei (siehe
Messblock 2). Die verbleibenden acht Dateien sind die einzigen der 17 Kandidaten, die auch
isoliert unter der tatsächlichen `tsconfig.strict.json`-`include`-Menge nachweislich fehlerfrei
bleiben — das ist die einzige Messung, die für das tatsächlich laufende Gate relevant ist.

**Bedingung für den nächsten Schritt:** Die neun ausgeschlossenen Dateien (und mit ihnen ein
relevanter Teil der übrigen 109 fehlerhaften Dateien) können erst dann gefahrlos in die
Zulassungsliste aufgenommen werden, wenn entweder (a) `types/globals.d.ts` um Ambient-Deklarationen
für die global referenzierten Objekte/Funktionen (`EntityLookup`, `StorageAPI`,
`window.render*`-Familie) erweitert wird, oder (b) die jeweils deklarierenden Dateien selbst mit
in die Zulassungsliste aufgenommen werden. Der weitaus größere Hebel bleibt aber eine echte
Typbeschreibung des globalen Datenobjekts `D` (`AppData`-Interface) statt der heutigen
`any`-artigen Lücke — das ist der Schritt, der den TS2339-Block (1616 von 1751 Fehlern) tatsächlich
angreifen würde. Beides ist ausdrücklich außerhalb des Scopes von Plan 14-07.

**Ehrliches Fazit:** `DEBT-01` ist mit diesem Plan zu einem kleinen, aber echten Teil geschlossen
(8 Dateien laufen unter `checkJs: true` nachweislich fehlerfrei, und zwar unter genau der
`include`-Menge, die auch tatsächlich geprüft wird) und für den weit überwiegenden Rest (126 von
134 Dateien, 1751 Fehler) ausdrücklich NICHT geschlossen. Es steht hier mit Zahl, nicht als
erledigt geführt.

---
*Phase: 14-tests-gates*
*Plan: 01*
*Erhoben: 2026-09-07*
*Ergänzt: Plan 14-07 (DEBT-01-Restposten), 2026-09-07*
