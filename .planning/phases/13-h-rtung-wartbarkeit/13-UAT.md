---
status: diagnosed
phase: 13-h-rtung-wartbarkeit
source: [13-01-SUMMARY.md, 13-02-SUMMARY.md, 13-03-SUMMARY.md, 13-04-SUMMARY.md, 13-05-SUMMARY.md, 13-06-SUMMARY.md, 13-07-SUMMARY.md, 13-08-SUMMARY.md, 13-09-SUMMARY.md, 13-10-SUMMARY.md, 13-11-SUMMARY.md, 13-12-SUMMARY.md]
started: 2026-09-06T14:00:00Z
updated: 2026-09-06T21:20:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Initiative nach der Aufteilung
expected: `features/initiative.js` wurde in drei Module geteilt (Kern 616, Beute 392, Kampf-Widgets 670 Zeilen) und hatte KEINE Bedienprobe. Kampf starten, Runden durchschalten, Schaden und Heilung anwenden, einen Effekt setzen, Todesrettungswürfe und Konzentration prüfen, Beute verteilen — alles wie vorher.
result: pass
note: >
  Der Nutzer meldete, Gold-Aufteilung sei nur aus dem Truhe-Tab erreichbar, nicht aus der
  Initiative. Nachgeprüft: KEINE Regression. showLootDistributionModal() liegt in
  features/loot-distribution.js (von dieser Phase nie angefasst) und ist ausschließlich über
  assets/templates/view-resources.html:19 verdrahtet; der Stand vor dem Split (cc75339)
  enthielt in features/initiative.js keinen Verweis darauf. Die LOOT-SYSTEM-Sektion, die
  13-10 nach initiative-loot.js verschob, ist die Beute-VERWALTUNG (11 Funktionen:
  renderLoot, showLootDetail, saveLoot, removeLoot, ...) — alle 11 vor UND nach dem Split
  vorhanden. Der Testauftrag war fehlerhaft formuliert (Orchestrator-Fehler), nicht die App.

### 2. Wiki nach der Aufteilung
expected: `features/wiki/wiki.js` wurde geteilt (554 + 673 Zeilen) und hatte ebenfalls keine Bedienprobe. Wiki-Eintrag anlegen, bearbeiten, löschen; Kategorien auf- und zuklappen; Verlinkung zu anderen Einträgen; Suche im Wiki.
result: pass

### 3. Whitelist-Stichprobe quer durch die App
expected: Die `call`-Aktion prüft seit SEC-03 gegen eine Whitelist mit 130 Zielen. Ein übersehenes Ziel führt dazu, dass ein Knopf STILLSCHWEIGEND nichts tut. Quer durch die App Knöpfe drücken — Kopfleiste, Werkzeuge, Modal-Schaltflächen, Layout zurücksetzen, Export/Import — und darauf achten, ob einer wirkungslos bleibt.
result: pass

### 4. URLs mit Unterstrichen im Text
expected: MAINT-03 hat die Unterstrich-Regel auf CommonMark gebracht. Eine URL mit mindestens zwei Unterstrichen in einen Wiki-Eintrag oder eine Notiz schreiben (z. B. `https://example.com/foo_bar_baz_qux`) und speichern — sie muss unverändert dastehen, nicht kursiv gesetzt oder zerrissen. Gegenprobe: `_kursiv_` soll weiterhin kursiv werden.
result: pass
note: >
  Anzeigepfad bestaetigt am gespeicherten Wiki-Eintrag: URL und snake_case_variable
  unversehrt, kursiv/fett greifen weiterhin. Der erste Versuch war durch den
  Doppel-Einfuege-Fehler (Fund 3) verdeckt; nach dessen Reparatur (e6cd20d) stand der
  Text einmal da — bestaetigt damit zugleich die Fund-3-Behebung in der echten App.
  Der IMPORT-Pfad (markdownToHtml) bleibt separat als Gap offen.

### 5. Würfelstatistik löschen
expected: Neu aus PERF-02. In der Würfelstatistik den Löschen-Knopf drücken — er muss nach Bestätigung fragen und dabei die EXAKTE Anzahl der Datensätze nennen. Abbrechen darf nichts löschen, Bestätigen leert den Store.
result: pass

### 6. Undo und stille Konsole
expected: Zwei Prüfungen in einem Durchgang. (a) PERF-01 hat Undo umgebaut (Dedupe + Byte-Budget): mehrere Änderungen nacheinander machen, dann mehrfach Strg+Z — jeder Schritt stellt den vorherigen Stand vollständig wieder her. (b) MAINT-06: dabei F12-Konsole offen lassen — beim normalen Arbeiten darf dort nichts erscheinen.
result: pass
note: >
  (a) Der Nutzer meldete zunaechst, Orte und NPCs seien nach Strg+Z verschwunden waehrend
  ein Wiki-Eintrag blieb. Rueckfrage ergab: es verschwanden ausschliesslich die waehrend
  Test 6 NEU angelegten. Das ist korrektes Verhalten und bestaetigt D-09: pushUndo() legt
  vor jeder destruktiven Operation einen VOLLSTAENDIGEN Kampagnen-Schnappschuss an, ein
  Strg+Z stellt einen davon ganz her. Der Wiki-Eintrag entstand in Test 4, also frueher —
  jeder spaetere Schnappschuss enthaelt ihn bereits, weshalb das Zurueckgehen ihn nicht
  entfernen kann. Dedupe wurde geprueft (zeichengenauer Vergleich der vollen
  Serialisierung, systems/undo.js) — kann verschiedene Zustaende nicht als gleich
  einstufen. Kein Datenverlust.
  (b) Konsole blieb beim normalen Arbeiten still.

## Summary

total: 6
passed: 6
issues: 1
pending: 0
skipped: 0
blocked: 0

## Auto-Covered (nicht vorgelegt)

41 von 43 Deliverables sind laut `uat.classify-coverage` deterministisch durch
bestehende Tests abgedeckt (Jest 1089/1089, Playwright 321 passed / 2 skipped,
pytest tests/build 24/24) und werden deshalb nicht einzeln vorgelegt.

Die zwei menschlichen Prüfpunkte der Phase wurden bereits vor dieser Sitzung
durchgeführt und freigegeben:

- 13-11 Bedienprobe Editor (zehn Punkte) — freigegeben 2026-09-06
- 13-12 Bedienprobe DM-Screen (zehn Punkte) — freigegeben 2026-09-06, mit der
  Beobachtung zur Widget-Liste, die sich als vorbestehend (keine Regression)
  erwies und als eigene Funktion umgesetzt wurde

Diese Sitzung ist eine freiwillige Stichprobe auf Fehlerarten, die automatisierte
Tests strukturell schlecht fangen — insbesondere die beiden Aufteilungen ohne
eigene Bedienprobe (13-09 wiki.js, 13-10 initiative.js).

## Deferred Ideas

- idee: "Gold-Verteilung aus der Initiative heraus erreichbar machen"
  quelle: "UAT Phase 13, Test 1 — Nutzerbeobachtung"
  begruendung: >
    Nach einem Kampf will der Spielleiter die Beute dort verteilen, wo er gerade ist.
    Heute erzwingt das einen Tab-Wechsel in die Truhe. Kein Defekt — die Funktion war nie
    aus dem Kampf erreichbar. Umsetzung waere klein: derselbe data-action="show-loot-
    distribution"-Knopf zusaetzlich in der Initiative-Werkzeugleiste; showLootDistributionModal()
    ist bereits global exportiert (features/loot-distribution.js:197).
  aufwand: klein

## Gaps

- truth: "Einfuegen mit Strg+V fuegt den Inhalt genau einmal ein"
  status: fixed
  fixed_in: "e6cd20d, 7dab71a (2026-09-06) — Ereignis-Guard e.__dndEditorPasteHandled in handleEditorPaste(); 5 eingefrorene Erwartungswerte in editor-insert.spec.js aufgetaut; 4 neue Unit-Tests; 09-BASELINE.md Fund 3 mit Aufloesungsvermerk"
  reason: >
    Nutzerbefund waehrend UAT Test 4: eingefuegter Text erscheint doppelt hintereinander.
    NICHT durch Phase 13 verursacht — initEditorPasteHandlers() und handleEditorPaste() sind
    byte-identisch zum Stand vor der Phase (verifiziert gegen cc75339). Bereits seit
    2026-07-25 als "Fund 3" in 09-BASELINE.md dokumentiert und dort auf "Phase 10/11"
    vertagt; Phasen 10, 11, 12 und 13 haben ihn nicht aufgegriffen.
  severity: major
  test: 4
  root_cause: >
    Doppelregistrierung: initEditorPasteHandlers() haengt handleEditorPaste sowohl direkt an
    jedes Element aus der editorIds-Liste (ui/editors/rich-text-insert.js:42) als auch
    dokumentweit in der Capture-Phase an alles mit Klasse .rich-editor / .dialog-text-area
    (Zeile 47-56). Ein Listener am Zielelement feuert unabhaengig von Capture/Bubble in der
    At-Target-Phase, also laufen beide. e.preventDefault() unterdrueckt nur die
    Browser-Voreinstellung, nicht den zweiten Handler. 15 der 17 gelisteten Editoren tragen
    beide Merkmale und sind betroffen (alle ausser char-notes). features/npcs/npc-dialogs.js:51
    registriert fuer NPC-Editoren eine dritte Instanz.
  artifacts:
    - path: "ui/editors/rich-text-insert.js"
      issue: "Zeile 42 (Element-Listener) und Zeile 47-56 (Dokument-Capture-Delegation) decken dieselben Elemente ab"
    - path: "tests/e2e/features/editor-insert.spec.js"
      issue: "Zeile 148-151 friert das fehlerhafte Verhalten als Sollwert ein (TABELLEN_ERWARTET enthaelt die doppelt verschachtelte Tabelle) — deshalb schlaegt kein Test an"
    - path: "features/npcs/npc-dialogs.js"
      issue: "Zeile 51 registriert handleEditorPaste ein drittes Mal fuer NPC-Editoren"
  missing:
    - "Doppelaufruf verhindern — robust gegen alle drei Registrierungswege, z. B. Ereignis-Markierung in handleEditorPaste() statt Umbau der Registrierung"
    - "Die eingefrorenen Erwartungswerte in editor-insert.spec.js bewusst auf den korrigierten Einfach-Einfuegewert ziehen (Fund 3 auftauen, nicht stillstellen)"
    - "Regressionstest, der den Doppeleinfuege-Pfad direkt abdeckt"
  debug_session: ""
  vorgeschichte: "09-BASELINE.md Fund 3 (2026-07-25), Entscheidung Zeile 147: bewusst nicht repariert, auf Phase 10/11 vertagt"

- truth: "URLs mit >=2 Unterstrichen werden nicht mehr korrumpiert (Erfolgskriterium 5)"
  status: failed
  reason: >
    Nur der ANZEIGE-Pfad ist repariert. renderMarkdownInContent() bekam in 13-03 die
    CommonMark-Wortgrenzen-Lookarounds; markdownToHtml() (ui/editors/markdown-converter.js,
    ab Zeile 189) hat weiterhin die ungeschuetzten Regeln _(.+?)_ und __(.+?)__ an Zeile
    213/210. Verhaltensbeleg (Modul via vm geladen): "https://example.com/foo_bar_baz" ->
    "foo<i>bar</i>baz"; "snake_case_name" -> "snake<i>case</i>name".
  severity: major
  test: 4
  root_cause: "MAINT-03 wurde auf den in der Anforderung genannten Anzeigepfad (Zeile 264) begrenzt; markdownToHtml() blieb unangetastet, obwohl Erfolgskriterium 5 den zweiten Halbsatz unbedingt formuliert."
  artifacts:
    - path: "ui/editors/markdown-converter.js"
      issue: "markdownToHtml() Zeile 210 (__..__) und 213 (_.._) ohne Wortgrenzen-Wächter — anders als renderMarkdownInContent() Zeile 271"
    - path: "systems/markdown-import-export.js"
      issue: "ruft markdownToHtml() fuer Import-Vorschau (174) und Import (222) auf — das sind die betroffenen Nutzerpfade"
  missing:
    - "Dieselben (?<!\w)/(?!\w)-Lookarounds auf die beiden Emphase-Regeln in markdownToHtml() anwenden"
    - "Testfall analog zu tests/unit/markdown-converter.test.js Zeile 225, aber gegen markdownToHtml()"
  debug_session: ""

