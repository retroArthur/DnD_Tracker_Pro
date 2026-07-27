---
phase: 10
phase_name: "Security-Härtung"
project: "D&D Kampagnen-Tracker Pro"
generated: "2026-07-27"
counts:
  decisions: 5
  lessons: 6
  patterns: 4
  surprises: 4
missing_artifacts:
  - "10-UAT.md (keine UAT-Session für diese Phase)"
---

# Phase 10 — Learnings: Security-Härtung

Sieben Pläne, davon zwei Gap-Closure-Runden. Die Phase lieferte den einzigen Milestone-Beleg, der
nicht aus einem Testlauf stammt: vier `*-SECURITY.md` mit `threats_open: 0` für die Phasen 1, 2, 9
und 10.

## Decisions

**Vier Per-Phasen-`SECURITY.md` statt einer Monolith-Datei**
Das Abschluss-Audit wurde pro Phase abgelegt (1, 2, 9, 10), mit unterschiedlicher Methodik je nach
Ausgangslage: retroaktives STRIDE für die Phasen 1 und 2, `verify-mitigations` für 9 und 10.
*Source: 10-05-SUMMARY.md*

**Phase-9-Register auf 5 sicherheitsrelevante Threats konsolidiert**
Die neun Phase-9-Pläne hatten ~24 Threat-Einträge, davon rund 19 Prozess- und
Lieferketten-Rauschen. Statt sie zu reproduzieren, wurden sie als solche benannt und das Register auf
die fünf echten Sicherheitsposten verdichtet.
*Source: 10-05-SUMMARY.md*

**`esc(0)`-Drift dokumentiert statt behoben**
Der Paritätstest fand einen einzigen echten Unterschied zwischen den beiden Sanitizer-Kopien:
`esc(0)` liefert `''` in `utils/basic.js`, `'0'` in `utils/testable-utils.js`. Als bekannt
festgeschrieben statt stillschweigend angeglichen — ausserhalb des Plan-Scopes.
*Source: 10-03-SUMMARY.md*

**„Kein Bild-Element" als redaktionelle Ungenauigkeit behandelt, nicht als Auftrag**
Das Akzeptanzkriterium verlangte wörtlich, dass kein `<img>` übrigbleibt. Mit dem beauftragten
Minimal-Fix (nur Ereignis-Attribute entfernen) ist das strukturell unerfüllbar — ein `<img>` ohne
`onerror` bleibt als inertes DOM-Element bestehen. Die Plan-eigenen `<prohibitions>` schlossen den
dafür nötigen DOMParser-Umbau ausdrücklich aus. Maßgeblich waren die `<must_haves><truths>`
(„kein Handler feuert", „Attribut landet nicht im DOM") — beide erfüllt und bewiesen.
*Source: 10-04-SUMMARY.md*

**Restrisiken dokumentiert statt behoben**
Drei akzeptierte Risiken statt zwei — T-10-17 (regexbasierte Paste-Zeit-Bereinigung) kam zu den zwei
D-08-Pflichteinträgen hinzu, bereits in 10-04 als für den Abschlussplan vorgemerkt angekündigt.
*Source: 10-05-SUMMARY.md, 10-07-SUMMARY.md*

## Lessons

**Ein Angriffsvektor, der nicht reproduziert, beweist nichts — auch nicht in RED**
Die erste Fassung der Unit-Vektoren nutzte `background-image:url(...)`. Diese Eigenschaft steht gar
nicht auf `allowedAttributes.style` und wurde schon vom **bestehenden** Filter blockiert — der Test
wäre rot gewesen, ohne die zu schließende Lücke zu belegen. Der echte Vektor war `background`, also
genau die bereits erlaubte Eigenschaft.
*Source: 10-07-SUMMARY.md*

**Freistehende `<td>`-Fragmente überleben den HTML5-Parser nicht**
Ohne Tabellenkontext verwirft der Parser sie (Foster-Parenting) — wodurch auch die
Erhaltungs-Gegenproben fälschlich rot liefen. Payloads müssen in
`<table><tr><td>…</td></tr></table>` gewrappt werden.
*Source: 10-07-SUMMARY.md*

**Ein vorgelagerter kosmetischer Filter kann einen Sicherheitstest still grün machen**
Die erste E2E-Payload nutzte durchgehend doppelt quotierte `style="…"`-Attribute. Die kosmetische
Attribut-Entfernungskette in `handleEditorPaste()` entfernt **jedes** doppelt quotierte
`style`-Attribut, bevor der Sanitizer überhaupt läuft — der Test lief grün gegen den **ungepatchten**
Stand. Erst drei unterschiedliche Notationsformen (doppelt quotiert als Kontrolle, einfach quotiert,
unquotiert) machten die Lücke sichtbar.
*Source: 10-07-SUMMARY.md*

**Ein erwarteter Ressourcen-404 ist kein Sicherheitssignal**
Der neue Testfall sammelte `pageerror` **und** generische `console`-Fehler. Nach dem Fix versucht der
Browser, das bewusst beibehaltene `<img src="x">` zu laden, was einen erwarteten
`ERR_FILE_NOT_FOUND`-Konsoleneintrag erzeugt und `expect(errors).toEqual([])` fälschlich rot machte.
Verengung auf `page.on('pageerror')` — echte, nicht abgefangene Exceptions.
*Source: 10-04-SUMMARY.md*

**Plan-Text und Quelltext können auseinanderlaufen — der Quelltext gewinnt**
Der Plan verortete die `validatedItems`-Abbildung in `executeImport()`. Tatsächlich lebt sie in
`showImportModal()`; `executeImport()` liest nur `modal.dataset.importItems` und persistiert. Die
Sanitisierung wurde an der **tatsächlichen** Stelle verdrahtet — funktional korrekt, weil genau dort
Rohdaten zu vertrauten Daten werden.
*Source: 10-02-SUMMARY.md*

**Ein Task-Gate kann einen Fix aus einem späteren Task erzwingen**
Der von Task 1 geschriebene Struktur-Test verlangte `saveUndoState`/`createAutoBackup` **vor**
`Object.assign(D, imp)`. Task 2s eigenes Verify-Gate verlangte die gesamte Testdatei grün. Ohne den
laut Plan erst in Task 3 vorgesehenen Fix konnte Task 2 sein eigenes Gate nicht erfüllen — der
zweizeilige Produktionsfix wurde vorgezogen.
*Source: 10-02-SUMMARY.md*

## Patterns

**Sanitizer-Parität über ein gemeinsames Vektor-Set**
Beide Kopien (`utils/basic.js` und `utils/testable-utils.js`) werden per `vm.runInContext` geladen
und ihre Ausgabe byteweise über 25 Vektoren verglichen — XSS-Vektoren, Markup-Vektoren und
CSS-Beacon-Obfuskation. Die eine bekannte Abweichung ist explizit festgeschrieben, nicht versteckt.
*Verwenden bei: jeder bewusst duplizierten Sicherheitslogik. Source: 10-03/10-06-SUMMARY.md*

**Tests gegen den Produktionsquelltext, nicht gegen eine Testkopie**
`security.test.js` lädt seit dieser Phase `utils/basic.js` selbst per `vm.runInContext` — vorher lief
alles nur gegen `testable-utils.js`. Ein grüner Test gegen eine Kopie belegt nichts über die Datei,
die die Anwendung tatsächlich ausführt.
*Verwenden bei: allem Sicherheitsrelevanten mit Spiegel-Implementierung. Source: 10-VALIDATION.md*

**`iframe srcdoc` als tragfähiger XSS-Vektor statt `<script>`**
Ein naives `<script>`-Payload reproduziert in diesem Repo nicht:
`createContextualFragment` markiert parser-erzeugte Skripte als nicht ausführbar. Der belastbare
Vektor ist `<iframe srcdoc="…">`, dessen Inhalt der Parser des verschachtelten Browsing-Kontexts
ausführt und der den Origin des Elternteils erbt.
*Verwenden bei: empirischen Sicherheitsreproduktionen in diesem Repo. Source: 10-06-SUMMARY.md*

**Den echten Paste-Pfad über `defaultPrevented` beweisen**
`defaultPrevented: true` belegt, dass der App-Handler tatsächlich lief — ergänzt um einen
Kontrolltest ohne `<table>`-Wrapper, der den anderen Zweig nimmt.
*Verwenden bei: Tests, die einen bestimmten Handler-Pfad voraussetzen. Source: 10-06-SUMMARY.md*

## Surprises

**Das Abschluss-Audit fand keinen einzigen neuen kritischen oder hohen Posten**
Die im Plan vorgesehene Eventualität (zusätzlicher Plan bei einem neuen Critical/High, D-12/T-10-22)
trat nicht ein. Nach zwei Gap-Closure-Runden war die Fläche tatsächlich sauber.
*Impact: Die Phase endete früher als für den ungünstigen Fall eingeplant. Source: 10-05-SUMMARY.md*

**Der `gsd-secure-phase`-Skill wurde bewusst nicht über das Skill-Werkzeug aufgerufen**
Das hätte eine eigene mehrstufige Subagent-Orchestrierung samt Gates pro Phase gestartet.
Stattdessen wurde der in `secure-phase.md` beschriebene Ablauf von Hand abgearbeitet — exakt die vom
Plan vorgesehene Rückfalloption, mit identischem Ablageort, Format und Registeraufbau.
*Impact: Vier `SECURITY.md` in Template-Struktur ohne Orchestrierungsaufwand. Source: 10-05-SUMMARY.md*

**Zwei Testvektoren mussten korrigiert werden, bevor RED überhaupt aussagekräftig war**
Beide Fehler lagen in der Testkonstruktion, nicht im Produktionscode, und beide wurden **vor** dem
finalen roten Commit gefunden. Ohne die Korrektur hätte die Phase einen grünen Sicherheitstest gegen
einen ungepatchten Stand als Beleg geführt.
*Impact: Der RED-Schritt selbst brauchte eine Verifikation. Source: 10-07-SUMMARY.md*

**`undoStack` ist im gebauten Bundle als bare Kennung aus `page.evaluate()` lesbar**
Empirisch verifiziert — es war kein neuer `window`-Export für den E2E-Undo-Nachweis nötig.
*Impact: Ein geplanter Produktionseingriff entfiel. Source: 10-02-SUMMARY.md*
