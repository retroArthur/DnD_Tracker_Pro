---
phase: 11
phase_name: "Architektur- & Build-Hygiene"
project: "D&D Kampagnen-Tracker Pro"
generated: "2026-07-27"
counts:
  decisions: 6
  lessons: 7
  patterns: 4
  surprises: 5
missing_artifacts:
  - "11-UAT.md (keine UAT-Session; SC4 stattdessen per Human-Verifikation im echten Browser geschlossen, protokolliert in 11-VERIFICATION.md)"
---

# Phase 11 — Learnings: Architektur- & Build-Hygiene

Die Abschlussphase des Milestones. Sieben Pläne über sieben Wellen, ein blockierender Checkpoint —
und die Phase, die am deutlichsten zeigte, wie weit ein grüner Test von einem Beweis entfernt sein
kann.

## Decisions

**`check_module_list_sync()` ersatzlos gelöscht statt als No-Op behalten**
Ihre einzige Aufgabe — zwei Listen vergleichen — ist strukturell unmöglich geworden, sobald es nur
noch eine Liste gibt. Dasselbe Prinzip später bei Dedup-Pass 3: entfernen, nicht entschärfen.
*Source: 11-01-SUMMARY.md*

**Brace-Depth-Tracking statt Spalten-0-Regex, weil die Technik schon lief**
Für die erweiterte Duplikaterkennung wurde exakt das Verfahren wiederverwendet, das der
Post-Build-Validator bereits nutzt — dieselbe Idiomatik an zwei Aufrufstellen, kein neues Muster im
Repo. Der Post-Build-Validator selbst blieb unangetastet (D-06: „bleibt als Backstop"), per
`git diff` mit null geänderten Zeilen belegt.
*Source: 11-03-SUMMARY.md*

**`requirements-dev.txt` statt Inline-`pip install pytest`**
Reproduzierbar, passend zur `package.json`-Pinning-Konvention des Projekts und ein natürlicher Ort
für künftige Python-Testabhängigkeiten. Die pytest-Version wurde zur Ausführungszeit lokal
gegengeprüft (`9.0.3`) statt dem Research-Snapshot blind zu vertrauen.
*Source: 11-04-SUMMARY.md*

**Den roten Vorbestand reparieren, nicht umgehen**
Der `test_build_generates_valid_javascript`-Fehlalarm hätte per `xfail` oder Skip umgangen werden
können. Stattdessen wurde er behoben, mit einer klaren Begründung: **ein CI-Gate, das an Tag eins auf
unbeteiligtem, längst grünem Code rot ist, erzieht das Team dazu, es zu ignorieren.**
*Source: 11-04-SUMMARY.md*

**Action-Versionen nur auf Major-Tags gepinnt**
`@v7`, kein SHA-Pinning und kein volles Semver. Zwei Jobs hatten versehentlich volles Semver
bekommen und wurden im selben Editier-Durchgang korrigiert, vor jeder Verifikation. Die
Verhaltensänderungen von `actions/checkout` (`persist-credentials`) und
`upload-artifact`/`download-artifact` (nicht-additive Artefakt-Behandlung) wurden **pro Job** geprüft
und im Commit dokumentiert statt stillschweigend als unbedenklich angenommen.
*Source: 11-04-SUMMARY.md*

**ARCH-04 bewusst auf „Pending" gelassen**
Plan 11-06 erfüllte nur die erste Hälfte (Triage). Es als abgeschlossen zu markieren hätte die noch
ausstehende Codebase-Map-Hälfte falsch dargestellt, die 11-07 besaß.
*Source: 11-06-SUMMARY.md*

## Lessons

**Ein grüner Test kann bedeuten, dass er nichts sehen kann**
Der neue Favicon-Smoke-Test war vom allerersten Lauf an grün — **gegen den ungepatchten Stand**. Der
Plan hatte das vorausgedacht („Ein grüner Lauf an dieser Stelle ist ein Befund und muss erklärt
werden"). Die Untersuchung per rohem CDP ergab: headless Chromium stellt die implizite
`/favicon.ico`-Anfrage **gar nicht**, und im headed-Modus feuern Playwrights eigene
`request`/`response`/`requestfinished`/`requestfailed`-Events für diese Anfrage **nie** — sie ist
browser-chrome-initiiert und hängt nicht am Frame-Tree der Seite. Der Bug war real, der Fix ist real,
nur der vorgeschriebene Detektionsmechanismus konnte beides nicht sehen.
*Source: 11-05-SUMMARY.md*

**Dieselbe Lücke ist über eine andere Ebene sehr wohl messbar**
Was Playwrights Page-API nicht sieht, protokolliert der HTTP-Server. Ein Zugriffs-Log zeigt jede
Anfrage unabhängig von Browser-Abstraktionen — für diese Prüfklasse der belastbarere Kanal.
*Source: Nachtrag in 11-VERIFICATION.md*

**Ein Fehlalarm wandert vier Pläne weit, wenn niemand ihn beansprucht**
`test_build_generates_valid_javascript` meldete zwei unabhängig gescopte `var el` in
`bestiary-editor.js` als Top-Level-Duplikat. Die Pläne 11-01, 11-02 und 11-03 bestätigten den Fund
jeweils erneut, verifizierten seine Vorbestehen und schoben ihn weiter — korrekt, denn die
Research-Tabelle hatte den Test ausdrücklich als „bleibt unverändert" markiert. 11-03 prüfte
zusätzlich per Grep, ob ein späterer Plan ihn beansprucht: **keiner**. Erst 11-04 räumte ihn ab, weil
er dort ein hartes Hindernis wurde.
*Source: 11-01/11-02/11-03/11-04-SUMMARY.md*

**Zwei Tests mit ähnlichem Namen können strukturell unverwandt sein**
`check_duplicate_functions()` prüft Quelldateien vor dem Bündeln; `test_build_generates_valid_javascript`
implementiert einen eigenen, nicht tiefenbewussten Duplikat-Scan direkt gegen den Bundle-Text. Den
Quell-Pre-Check zu reparieren ändert am Heuristik-Bug des anderen Tests nichts.
*Source: 11-03-SUMMARY.md*

**Ein textbasierter Parser darf nicht scope-bewusst sein müssen**
`load_template_list()` konnte `parse_js_string_array()` unverändert wiederverwenden, obwohl
`TEMPLATES` in `loader.js` funktions-lokal ist — der Parser arbeitet auf Text, nicht auf Scopes. Als
Docstring-Caveat festgehalten statt als stille Annahme.
*Source: 11-02-SUMMARY.md*

**Wiederverwendung ist kein Selbstzweck**
`load_css_import_order()` nutzt bewusst **nicht** `parse_js_string_array()`: `assets/styles.css` hat
keine Kommentare zwischen den `@import`-Zeilen, ein einfacher dedizierter Regex genügt. Ein
unnötiger Kommentar-Strip-Durchgang wäre Ballast gewesen.
*Source: 11-02-SUMMARY.md*

**Eine als stale bekannte Datei darf nicht sich selbst belegen**
Bei der Triage wurden 22 der 46 CONCERNS-Einträge als bereits erledigt eingestuft — jeder einzeln
gegen den **Live-Code** geprüft, nicht gegen den Text der CONCERNS.md. D-15 verlangte das
ausdrücklich, weil die Datei ihre eigene Veraltung bewies (sie sprach von „92 Modulen" bei
tatsächlich ~123).
*Source: 11-06-SUMMARY.md*

## Patterns

**Single Source of Truth mit Hard-Abort statt Synchronitätsprüfung**
Statt zwei Listen zu vergleichen und bei Drift zu warnen, liest der Build die eine Liste und bricht
hart ab, wenn eine gelistete Datei fehlt. Drift wird strukturell unmöglich statt nachträglich
erkannt.
*Verwenden bei: jeder Duplikation, die „synchron gehalten" werden muss. Source: 11-01/11-02-SUMMARY.md*

**Verhaltensgarantien statt Interna-Tests**
Nach dem Entfernen von Dedup-Pass 3 gibt es bewusst keinen Test „Pass 3 wirft". Bewiesen wird
stattdessen: ein Quell-Duplikat wird vor dem Bündeln abgefangen (Exit ≠ 0, keine Ausgabedatei), und
es existiert kein Pfad mehr, der ein Bundle mit stillem Orphan-Body erzeugt. Wer nach dem alten
Testnamen sucht, hält das fälschlich für eine Lücke — deshalb steht die Auslegung explizit in der
Roadmap und in `11-VALIDATION.md`.
*Verwenden bei: Refactorings, die einen Mechanismus ersatzlos entfernen. Source: 11-03-SUMMARY.md*

**Negativkontrolle neben der Positiverkennung**
`test_nested_declaration_is_not_a_duplicate` sichert ab, dass der erweiterte Pre-Check verschachtelte
Deklarationen **nicht** meldet. Ohne sie wäre eine zu breite Erkennung unbemerkt geblieben — genau
der Fehler, den der reparierte Fehlalarm vorgeführt hat.
*Verwenden bei: jeder neuen Erkennungslogik. Source: 11-03-SUMMARY.md*

**Empirisch prüfen statt dem Research-Snapshot vertrauen**
Die pytest-Version wurde zur Ausführungszeit neu ermittelt, die Action-Verhaltensänderungen pro Job
bewertet, der D-11-Zweig anhand der tatsächlichen Beobachtung entschieden („die Beobachtung, nicht
die Erwartung, entscheidet").
*Verwenden bei: allem, was ein Research-Dokument als Momentaufnahme festhält. Source: 11-04/11-05-SUMMARY.md*

## Surprises

**Die Meta-Tag-Deprecation ließ sich über drei Kanäle nicht nachweisen**
`page.on('console')`, CDP `Log.entryAdded` und CDP `Audits.issueAdded` produzierten **kein** Signal
zu `apple-mobile-web-app-capable` — weder mit noch ohne den zusätzlichen Tag. Chromium 143.0.7499.4
gibt diese Meldung bei einem einfachen Seitenaufruf in diesem Harness schlicht nicht aus.
*Impact: Der D-11-Zweig wurde nach der Regel „leere Sammlung → Tag bleibt" entschieden, mit dem
ausdrücklichen Vorbehalt, dass „leer" hier eine Werkzeug-/Versionsgrenze ist und kein Beweis, dass
die Warnung nie auftritt. Source: 11-05-SUMMARY.md*

**Der Favicon-Fix ließ sich nur informell beweisen**
Die Gegenprobe nach dem Fix — null favicon-bezogene CDP-Events im headed-Modus — bestätigte die
WHATWG-Spec-Aussage und damit die Wirksamkeit. Aber sie lief als Ad-hoc-Skript, nicht als
committeter Spec. Ein realer Beweis ohne reproduzierbaren Träger.
*Impact: Als offener Broken-Windows-Eintrag geführt; später per Human-Verifikation im echten Browser
nachgeholt. Source: 11-05-SUMMARY.md*

**Der Research fand einen Live-Bug, den CONTEXT.md nicht kannte**
`loader.js`' `TEMPLATES` fehlte `view-bestiary.html`, während `build.py` es hatte — echte Drift
zwischen den beiden Listen, gefunden bevor die SSoT sie strukturell unmöglich machte.
*Impact: Bestätigte die Prämisse der Phase mit einem konkreten Fall statt mit einem Argument.
Source: 11-RESEARCH.md, via 11-02*

**Der Favicon-Encoder war defekt, und der Fehler kam aus dem Build**
`build.py` flachte `"` zu `'` ab und kollidierte damit mit `font-family="'Courier New', …"` in
`icons/icon.svg`. Gefunden im Advisory-Audit vor dem Checkpoint, behoben durch Umstellung auf einen
einzigen `urllib.parse.quote`-Durchgang plus Regressionstest.
*Impact: `tests/build/` wuchs von 23 auf 24; der Data-URI ist seither nachweislich wohlgeformt.
Source: STATE.md Advisory-Audit*

**Vier Pläne in Folge meldeten `1 failed, 22 passed` als korrektes Ergebnis**
Weil der Fehlalarm dokumentiert, unabhängig als vorbestehend verifiziert und ausdrücklich ausserhalb
des jeweiligen Scopes war, wurde er dreimal bewusst nicht behoben — statt still weitergetragen.
*Impact: Diszipliniert, aber teuer: drei Pläne investierten Aufwand in die erneute Bestätigung
desselben Fundes. Source: 11-01/11-02/11-03-SUMMARY.md*
