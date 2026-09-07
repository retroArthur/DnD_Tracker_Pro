---
phase: 12
phase_name: "Datensicherheit"
project: "D&D Kampagnen-Tracker Pro"
generated: "2026-09-05"
counts:
  decisions: 10
  lessons: 9
  patterns: 9
  surprises: 8
missing_artifacts: []
---

# Phase 12 Learnings: Datensicherheit

## Decisions

### Weg B — kein automatischer Zweit-Download
Der Umzugs-Wizard löst den Audio-Export nicht mehr automatisch im selben Klick-Handler aus. Stattdessen bietet das Divergenz-Banner einen eigenen Button an, der eine zweite, echte Nutzergeste liefert.

**Rationale:** Chromes Sperre für automatische Downloads ist gestengebunden, nicht zeitgebunden — ein `setTimeout`, ein `await` oder ein sonstiger Timing-Trick hätte das Problem nicht gelöst. Nur ein zweiter echter Klick erzeugt eine eigene Geste. Entscheidung des Entwicklers nach empirischer Diagnose.
**Source:** 12-02-SUMMARY.md

---

### Gescheiterte Push-Validierung blockiert die Aktion nicht (D-06)
Ein gescheitertes `pushUndo()` bei nicht serialisierbarem `window.D` zeigt einen Warn-Toast, lässt die aufrufende destruktive Operation aber weiterlaufen.

**Rationale:** Am Spieltisch nie blockieren. Bewusste Design-Entscheidung mit dokumentierter Nebenwirkung — die dann in Plan 12-13 (SEC-02) ihren Preis forderte, weil genau dieser Zustand das nächste Strg+Z traf.
**Source:** 12-05-SUMMARY.md

---

### Aufgeschobene Löschung statt Scope-Reduktion
Der UI-Löschpfad für Audiodateien setzt einen Grabstein statt sofort zu löschen; `deleteSoundBlob()` bleibt hart und löscht weiterhin endgültig.

**Rationale:** Die Recherche hatte den Blob-Verlust nach Undo als architektonische Grenze deklariert (`saveUndoState()` snapshottet nur `window.D`, nie IndexedDB) und vorgeschlagen, nach Undo nur die Referenz wiederherzustellen. Der aufgeschobene Löschpfad umgeht die Grenze, ohne die Snapshot-Architektur anzufassen. Das Sitzungs-Aufräumen und die bestehende E2E-Suite brauchen die sofortige Löschung weiterhin.
**Source:** 12-06-SUMMARY.md

---

### Sperrliste statt Zulassungsliste für die Backup-Inhaltsprüfung
`_hatKampagnenInhalt()` arbeitet mit einer Sperrliste bekannt-leerer Schlüssel, nicht mit einer Zulassungsliste erwarteter Inhalte.

**Rationale:** Das Risikoprofil beim Backup ist spiegelverkehrt zum Wizard. Beim Wizard ist ein falsches „nicht frisch" harmlos; beim Backup ist ein falsches „leer" der teurere Fehler, weil er eine gute Sicherung überschreibt. Eine Zulassungsliste würde eine Kampagne mit ungewöhnlichem Inhalt vom Backup ausschließen.
**Source:** 12-12-SUMMARY.md

---

### Abbruch statt teilweiser Ausführung bei gescheiterter Serialisierung
Scheitert `JSON.stringify(D)` in `undo()` oder `redo()`, bleiben **beide** Stacks unverändert — kein halber Zustandswechsel.

**Rationale:** Wortgetreue Übernahme der `<consequence_note>` des Plans. Ein halb ausgeführter Wechsel (Push gelungen, Pop nicht) wäre schlimmer als gar keiner, weil er Historie verliert, ohne es zu melden. Es wird genau einmal pro Aufruf serialisiert, das Ergebnis wiederverwendet.
**Source:** 12-13-SUMMARY.md

---

### Blockgrenze statt Merker
Der Import-`try` endet strukturell nach dem Rücksprung aus `importFn()`; die Nachbearbeitung liegt außerhalb mit eigenem inneren try/catch. Kein `importErfolgreich`-Flag.

**Rationale:** Ein nach der Umstellung nie wahr werdendes Flag wäre totes, untestbares Beiwerk gewesen. Die Invariante aus Task 3 (Tabelle über drei Wurfstellen) übernimmt den Rückfallschutz. Die zwei try/catch-Ebenen sind bewusst getrennt: die äußere verhindert die falsche Fehlermeldung, die innere verhindert, dass ein Ausfall der Zusatzauskunft die Hauptmeldung mitreißt.
**Source:** 12-14-SUMMARY.md

---

### Grenzwerte voneinander ableiten statt unabhängig wählen
`AUDIO_IMPORT_MAX_TOTAL_BYTES` leitet sich aus `AUDIO_EXPORT_SAFE_RAW_BYTES` ab; `getAudioImportMaxBytes()` berechnet die Wizard-Importgrenze zur Laufzeit aus derselben Quelle.

**Rationale:** Kalibrierungsschutz. Die vorher unabhängig gewählten 350 MiB gegen 300 MiB Export waren als WR-03 aufgefallen — eine vierte unabhängige Zahl hätte dasselbe Problem neu erzeugt. Wo eine Zahl gespiegelt werden muss (Einzelgrenze gegen `soundboard-idb.js`), sichert stattdessen ein Drift-Test die Ausrichtung.
**Source:** 12-15-SUMMARY.md, 12-16-SUMMARY.md

---

### Merge-Reihenfolge beim Umzugs-Import: Import gewinnt, Lokales überlebt
`importFullExport()` führt Würfel-Favoriten und Kampagnenindex zusammen: importierte Einträge zuerst, dann die erhaltenen lokalen; `active` stammt immer aus dem Import. Favoriten-Gleichheit über `{ name, notation }`.

**Rationale:** Bewusst asymmetrische Design-Regel. Bei Schlüsselkollision gewinnt der Import (das ist die Absicht eines Umzugs), aber alles, was der Import nicht kennt, überlebt. `{ name, notation }` ist die echte Form der Favoriten — eine abweichende Alt-Testvorlage `{ id, name, formula }` wurde ausdrücklich nicht als Beleg akzeptiert.
**Source:** 12-16-SUMMARY.md

---

### Geteilte Requirement-IDs nicht pro Plan als vollständig markieren
SAFE-01/02/06 wurden in Plan 12-01 nicht in `requirements-completed` gesetzt, obwohl sie im Plan-Frontmatter stehen.

**Rationale:** Jede dieser IDs verteilt sich über mehrere Pläne (SAFE-01 auf 12-01+12-02, SAFE-02 auf 12-01+12-03, SAFE-06 auf 12-01+12-07). Ein `requirements mark-complete` im ersten Plan hätte REQUIREMENTS.md fälschlich als fertig markiert, während die Wizard-Integration, die Multi-Kampagnen-Logik und die restlichen Randfälle noch ausstanden.
**Source:** 12-01-SUMMARY.md

---

### Zweite Security-Runde auf die neuen Threats begrenzt
Der Audit vom 2026-09-05 prüfte ausschließlich T-12-45…T-12-72 (die 28 Threats der Gap-Pläne). Die 22 als `open` geführten Zeilen des Registers von 2026-09-04 wurden nicht erneut klassifiziert.

**Rationale:** Ausdrückliche Nutzerentscheidung. Diese 22 sind laut § Methodenkritik der Datei Triage-Liste und nicht Befund; eine Wiederholung hätte dieselbe verzerrte Vorrunde reproduziert. Sie zählen weiterhin nicht in `threats_open`, stehen aber unverändert als offene Triage im Register.
**Source:** 12-SECURITY.md

---

## Lessons

### Einundzwanzig grüne Unit-Tests fangen keine Browser-Richtlinie
Der automatische Zweit-Download lieferte korrekte Daten, löste den Anchor-Klick mit korrektem Namen und `blob:`-Href aus, kehrte fehlerfrei zurück und zeigte den Erfolgs-Toast — die Datei kam nie an.

**Context:** Die Unit-Tests prüfen den Datenpfad, nicht Chromes Download-Gate. Sichtbar wurde es erst durch menschliche Sichtung im Checkpoint und eine Instrumentierung von `HTMLAnchorElement.prototype.click`. Wo eine Browser-Richtlinie im Spiel ist, ist der Checkpoint die einzige Erkennungsschicht.
**Source:** 12-02-SUMMARY.md

---

### Grün heißt nicht abgedeckt — drei Muster
Die Suite war grün, bedeutete aber nicht, was sie zu bedeuten schien: (1) tautologischer Test, dessen Erwartungstabelle aus den Exports des Prüflings stammte; (2) Tests, die IDB- und Quota-Logik lokal nachbildeten statt Produktivcode auszuführen; (3) leeres Orakel — ein Test mutierte `_appVersion`, ein Feld, das repo-weit geschrieben und nirgends gelesen wird.

**Context:** Aufgedeckt im Nyquist-Audit vom 2026-09-04, das 14 von 16 Anforderungszeilen nachziehen musste (vorher: 2 COVERED, 11 PARTIAL, 3 MISSING). Die Frage „stammt der Sollwert aus dem Testfile oder aus dem Prüflings-Modul?" gehört an jeden neuen Test.
**Source:** 12-VALIDATION.md

---

### Eine Refuter-Voreinstellung misst sich selbst
Nur Critical/High liefen durch die adversariale Challenge-Stufe, mit der Vorgabe „im Zweifel gilt die Schließung als zu großzügig". Ergebnis: 19 von 22 Critical/High heruntergestuft, 15 von 15 Medium (nie angefochten) blieben closed.

**Context:** Die OPEN/CLOSED-Verteilung korrelierte perfekt mit „wurde angefochten" und gar nicht mit dem Schweregrad — ein Artefakt des Aufbaus, kein Ergebnis. Drei Befunde wurden nachgeprüft und waren echt; 19 blieben unentschieden. Der Folgeaudit vom 2026-09-05 lief mit ausdrücklichem Verbot dieser Voreinstellung und lieferte 27 belegte CLOSED plus einen echten OPEN-Befund.
**Source:** 12-SECURITY.md

---

### `npm run build` hält den Dev-Bundle nicht aktuell — und Playwright läuft gegen den
`npm run build` ist auf `python build.py --production` gemappt und schreibt nur `dist/dnd-tracker-optimized.html`. Der Dev-Bundle entsteht nur durch `python build.py` bzw. `npm run build:dev`.

**Context:** Nach den beiden Review-Fix-Commits war der Dev-Bundle drei Stunden alt und enthielt weder den CR-01- noch den WR-01-Fix; der zuvor gemeldete Playwright-Lauf mit 321 bestandenen Tests hatte für diese zwei Pfade Vor-Fix-Code geprüft. Gefunden vom Security-Auditor als T-12-70, nicht von den Gates. Gegenprobe: `grep -c` auf einen charakteristischen Marker des jüngsten Fixes in **beiden** Bundles.
**Source:** 12-SECURITY.md

---

### Ein Quellkommentar kann das Gegenteil des Codeverhaltens behaupten
An der Fundstelle von IMPL-01/SEC-01 stand ausdrücklich, der Hauptimport werde „durch dieses Ergebnis in keinem Fall beeinflusst" — genau das Gegenteil des tatsächlichen Verhaltens.

**Context:** Der Kommentar war das stärkste Argument gegen eine Prüfung dieser Stelle und hat den Defekt über zwei Verifikationsrunden getragen. Ein Kommentar ist kein Beleg; er ist eine Behauptung, die genauso zu prüfen ist wie der Code.
**Source:** 12-VALIDATION.md, 12-14-SUMMARY.md

---

### Ein Bestandstest kann den Fehler in seiner eigenen Assertion kodieren
Ein Test aus Plan 12-10 (CR-02) prüfte das fehlerhafte SEC-03-Verhalten als Soll — Assertion und Kommentar hielten die falsche Namensauflösung fest.

**Context:** Beim Beheben von SEC-03 musste der Test korrigiert werden (dokumentierte Regel-1-Abweichung). Ein grüner Bestandstest belegt nicht, dass das geprüfte Verhalten richtig ist — nur, dass es unverändert ist.
**Source:** 12-12-SUMMARY.md

---

### Ein Wartehinweis vor der Machbarkeitsprüfung ist ein Versprechen, das sofort gebrochen wird
`downloadAudioExport()` zeigte den Hinweis „bei großen Bibliotheken dauert das einen Moment" unbedingt als Erstes; die Größenprüfung schlug unmittelbar danach zu. Beide Toasts fielen in dieselbe Sekunde.

**Context:** Gefunden bei der menschlichen Sichtung in Task 4. Der Fix zieht die reine Metadatenprüfung vor; der `throw` bleibt an seiner Stelle, damit die Fehlermeldung genau eine Quelle behält. Bemerkenswert am Test: ein Quelltext-Grep auf den Toast-Text hätte vor *und* nach dem Fix bestanden — nur ein Verhaltenstest mit Spy trägt hier.
**Source:** 12-07-SUMMARY.md

---

### `vm.runInContext()` legt top-level `const` nicht auf dem Kontextobjekt ab
Anders als `function`-Deklarationen sind mit `const` deklarierte Top-Level-Werte nicht als Eigenschaft des Kontext-Objekts sichtbar.

**Context:** Traf zweimal zu: bei der Extraktion von `CAMPAIGN_CONTENT_ARRAYS` (12-08, Umweg über `context.window.…`) und bei der geplanten Dekodier-Attrappe in 12-15, die deshalb technisch nicht erreichbar war und durch eine Quelltext-Regex-Extraktion ersetzt wurde. Betrifft jeden Test in diesem Repo, der Quellen per `vm.createContext` lädt.
**Source:** 12-08-SUMMARY.md, 12-15-SUMMARY.md

---

### Ein im Plan beschriebenes Testszenario kann strukturell unherstellbar sein
Das Test-F-Setup aus Plan 12-10 ließ sich nicht wie beschrieben bauen: die Dedup-Logik in `resolveBackupTargets()` macht den Key des Standard-Pseudo-Ziels konstruktionsbedingt gleich dem aktiven Key, es kann also nie selbst das fehlzugeordnete Opfer sein.

**Context:** Der Executor hat die Rollen mechanisch vertauscht, statt den Plan zu erzwingen — richtige Reaktion, aber sie gehört ausdrücklich in den Wellenbericht, sonst liest sie sich später wie eine stille Planabweichung.
**Source:** 12-10-SUMMARY.md

---

## Patterns

### Mutationsnachweis in-process statt im Arbeitsbaum
Nach dem Grün-Werden wird der Produktionscode absichtlich beschädigt und der Fehlschlag beobachtet. Bei parallel arbeitenden Agenten nicht im Arbeitsbaum, sondern über einen `jest --setupFiles`-Hook, der `fs.readFileSync` beim Lesen der Quelldatei in-memory umschreibt.

**When to use:** Für jede neue Assertion, die eine Sicherheits- oder Datenintegritätseigenschaft behauptet. Funktioniert in diesem Repo zuverlässig, weil die Tests Quellen ohnehin per `vm.createContext` laden. Nach jeder Mutation `git diff` gegen die betroffene Datei prüfen — er muss leer sein.
**Source:** 12-07-SUMMARY.md, 12-VALIDATION.md

---

### `test.failing` als Anker für einen bestätigten, nicht behobenen Defekt
Der Test meldet „bestanden", weil sein Körper wirft; sobald der Defekt behoben ist, meldet Jest ihn als *unerwartet bestanden* und erzwingt das Umstellen auf `test()`.

**When to use:** Wenn ein Audit einen echten Defekt findet, aber nur ein Nur-Test-Mandat hat. Der Mechanismus hat in dieser Phase nachweislich funktioniert: IMPL-01 und IMPL-02 wurden von den Gap-Plänen 12-14 und 12-13 behoben und beide Anker umgestellt. Schwäche: schlägt der Test aus einem *anderen* Grund im Setup fehl, meldet `test.failing` ebenfalls „bestanden" — die Wurfstelle einmal isoliert belegen.
**Source:** 12-VALIDATION.md, 12-13-SUMMARY.md, 12-14-SUMMARY.md

---

### Erwartungstabelle als handgeschriebenes Literal, nie aus den Exports des Prüflings
`describe.each()`/`test.each()`-Tabellen werden im Testfile ausgeschrieben, plus ein Test, der die vollständige Liste festnagelt.

**When to use:** Immer, wenn eine Tabelle aus einer Konstanten des Prüflings gespeist werden könnte. Ein Refuter entfernte 13 von 17 Einträgen aus `CAMPAIGN_CONTENT_ARRAYS` — die Suite blieb grün, weil die Tests mitverschwanden.
**Source:** 12-VALIDATION.md

---

### Gegenprobe neben jedem Härtungstest
Zu jeder neuen Schranke gehört ein Test, der belegt, dass sie nicht zu weit greift: „Kampagne mit nur `spells` wird weiterhin gesichert" neben der Leerprüfung; „echter Importfehler meldet weiterhin Fehlschlag" neben der gelockerten `try`-Grenze.

**When to use:** Bei jeder Härtung, die etwas ablehnt oder etwas nicht mehr meldet. Die Gegenprobe ist der Test gegen den Fix, der zu weit greift — in dieser Phase als eigener Threat geführt (T-12-48, T-12-58, T-12-66).
**Source:** 12-12-SUMMARY.md, 12-14-SUMMARY.md, 12-16-SUMMARY.md

---

### Drift-Test über Quelltext-Regex bei gespiegelten Konstanten
Wo eine Zahl in zwei Modulen stehen muss, liest ein Test beide Quelldateien als Text, extrahiert die Werte per Regex und vergleicht sie.

**When to use:** Wenn eine Konstante aus Architekturgründen nicht importiert werden kann (hier: die 100-MB-Einzelgrenze in `audio-export.js` gegen `MAX_AUDIO_BYTES_HARD` in `soundboard-idb.js`). Die Alternative — eine dritte unabhängig gewählte Zahl — hat als WR-03 bereits einen Befund erzeugt.
**Source:** 12-15-SUMMARY.md

---

### Vorschleife vor der Schreibschleife: Alles oder nichts
Formprüfungen für **alle** Einträge laufen in einer eigenen Schleife, bevor der erste Schreibvorgang stattfindet.

**When to use:** Bei jedem Import, der mehrere Datensätze schreibt. Sonst schreibt ein Fehler an Position 4 die Positionen 1–3 bereits fest, während der Aufrufer „Import fehlgeschlagen" meldet — index-verwaiste Daten bei einer Meldung, die das Gegenteil verspricht. Das Muster existierte in derselben Funktion bereits für die Key-Whitelist; CR-01 war die Stelle, die es nicht mitgemacht hatte.
**Source:** 12-REVIEW.md, 12-REVIEW-FIX.md

---

### Ausschlussliste als exportierte Konstante mit Vollständigkeitstest
Eine bisher nur kommentierte Ausschlussregel wird zu `CAMPAIGN_CONTENT_EXCLUDED` (18 begründete Einträge), abgesichert durch einen Test, der alle `D.xxx`-Zugriffe im Quellbaum sammelt und für jeden eine Klassifizierung verlangt.

**When to use:** Wenn eine Liste „was zählt als Inhalt" über die Zeit auseinanderläuft. Wichtig: der Regex-Sweep findet keine dynamischen `D[key]`-Zugriffe — `timers` und `campaign` mussten trotz negativem Sweep-Ergebnis aufgenommen werden.
**Source:** 12-16-SUMMARY.md

---

### Rebuild-Plan in eigener Folgewelle mit `depends_on`
Der `dist`-Neubau gehört nicht als letzter Plan in dieselbe Welle wie die Fixes, sondern in eine eigene Welle mit `depends_on` auf die Geschwister.

**When to use:** Bei jeder Gap-Closure-Runde mit parallelen Plänen. Parallele Pläne sehen die Commits ihrer Geschwister nicht — ein Rebuild in derselben Welle baut einen unvollständigen Stand. Der Planer hat diese Widersprüchlichkeit im Briefing selbstständig erkannt und begründet korrigiert.
**Source:** 12-17-PLAN.md

---

### Commit-Granularität: Tasks zusammenlegen, wenn der Zwischenzustand falsch wäre
Zwei Tasks kommen in einen Commit, wenn der Stand nach dem ersten allein nicht lauffähig oder semantisch falsch wäre — dokumentiert, nicht stillschweigend.

**When to use:** In 12-04 hätte ein Zwischen-Commit einen Zustand erzeugt, in dem `isFreshInstall()` bereits ein `Promise` liefert, die Aufrufer es aber noch synchron auswerten — ein Promise ist immer truthy, die Bedingung hätte sich still umgekehrt (genau der Fehler, den T-12-13 verhindern soll). In 12-05 rief die Funktion aus Task 2 direkt im Erfolgspfad von Task 1 auf.
**Source:** 12-04-SUMMARY.md, 12-05-SUMMARY.md

---

## Surprises

### Chrome verwirft den zweiten Download stumm
Der erste Download aus einer Nutzergeste kommt an, jeder weitere wird hinter der „Automatische Downloads"-Berechtigung gegated — unter `file://` besonders restriktiv. Ohne Fehler, ohne Konsolenmeldung, mit Erfolgs-Toast.

**Impact:** Kostete eine eigene Diagnose mit Prototyp-Instrumentierung und führte zu einer UX-Änderung (Weg B) statt eines Bugfixes. Betraf den Kern der Phase: der einmalige, unwiederholbare Umzug hätte still das Audio verloren.
**Source:** 12-02-SUMMARY.md

---

### Das leere Kampagnenschema besteht die Leerprüfung
`initializeData()` liefert 23 semantisch leere Schlüssel. Die Prüfung `Object.keys(obj).length > 0` sagt darauf `true`.

**Impact:** SEC-04, der einzige als critical eingestufte Befund der Gap-Runde. Ein beschädigter localStorage ließ die Sicherung ihre eigene gute Sicherung überschreiben und den ältesten guten Snapshot löschen — bei grünem Statusanzeiger. Zusätzlich überraschend: `createCampaign()` baut ein Leerobjekt mit **16** statt 23 Schlüsseln, die Prüfung musste beide Formen abdecken.
**Source:** 12-12-SUMMARY.md, 12-VERIFICATION.md

---

### Dreizehn von siebzehn Einträgen löschen ließ die Suite grün
Ein Refuter entfernte fast die ganze Anforderung aus `CAMPAIGN_CONTENT_ARRAYS` — die Tests verschwanden mit, weil sie ihre Tabelle daraus bezogen.

**Impact:** Die schwerwiegendste der drei aufgedeckten Grün-Illusionen. Führte zum Muster „Erwartungstabelle als Literal" und zu einem Test, der die vollständige Liste festnagelt.
**Source:** 12-VALIDATION.md

---

### `_appVersion` wird geschrieben und nirgends gelesen
Der „Versions-Rundlauf"-Test mutierte ein Feld ohne jeden Leser; es gibt keine stempelgesteuerte Kompatibilitätsverzweigung beim Import.

**Impact:** Ein Test, der nichts prüfen konnte. Ersetzt durch Tests auf `migrateData()`, das die Kompatibilität tatsächlich herstellt. Das Feld selbst bleibt als Nebenbefund offen.
**Source:** 12-VALIDATION.md

---

### Der Dev-Bundle war drei Stunden alt, als die E2E-Suite grün meldete
`dist/dnd-tracker-bundled.html` stammte von 13:04, die Review-Fixes von 16:10/16:11. Beide Fix-Marker fehlten im Dev-Bundle, standen aber im Production-Bundle.

**Impact:** Der einzige echten OPEN-Befund des zweiten Security-Audits (T-12-70). Das Post-Merge-Gate hatte nach jeder Welle nur `npm run build` gefahren — die Lücke lag im Vorgehen des Orchestrators, nicht in einem Plan. Behoben durch Dev-Build und E2E-Neulauf; die Vorbedingung steht jetzt in der Sampling-Rate von 12-VALIDATION.md.
**Source:** 12-SECURITY.md

---

### Der Threat-Register-Block ist eine Markdown-Tabelle, kein YAML
Ein `grep "threat_id:"` über die Pläne liefert null Treffer, obwohl alle 17 einen `<threat_model>`-Block tragen — die Register stehen als Pipe-Tabelle unter `## STRIDE Threat Register`.

**Impact:** Wiederkehrendes Muster in diesem Projekt: ein Handler meldet `total: 0` für etwas, das sichtbar in der Datei steht. Dasselbe traf beim Phasenabschluss die Requirement-IDs — `- **SAFE-01** ✓ (…):` wird wegen des `✓` zwischen ID und Doppelpunkt nicht erkannt, `- **SEC-03** (…):` schon. `0` heißt „Format verfehlt", nicht „nichts da".
**Source:** 12-SECURITY.md, 12-VERIFICATION.md

---

### `dist/` ist repo-weit gitignored, obwohl Pläne die Bundles in `files_modified` führen
Plan 12-17 listet beide Bundles als geänderte Dateien, kann sie aber nicht committen (`.gitignore:5`).

**Impact:** Der Integrationsplan erzeugte null Task-Commits, nur den SUMMARY-Commit — was beim Spot-Check wie ein gescheiterter Executor aussieht, aber die korrekte Ausführung ist. Planungsungenauigkeit, kein Ausführungsfehler.
**Source:** 12-17-SUMMARY.md

---

### Die Verify-Formulierung des Plans zählte Kommentarprosa mit
`grep -c "test\.failing"` traf in beiden Ankerdateien historische Kommentartexte, nicht lebende Aufrufe.

**Impact:** Hätte den Integrationsplan an einer Scheinbedingung scheitern lassen. Der Executor hat per `grep -n "test\.failing("` (echte Funktionsaufrufe, null Treffer) plus vollem grünen Suitenlauf ohne „unexpectedly passed" gegengeprüft und die Nuance dokumentiert, statt eine rote Suite zu melden.
**Source:** 12-17-SUMMARY.md
