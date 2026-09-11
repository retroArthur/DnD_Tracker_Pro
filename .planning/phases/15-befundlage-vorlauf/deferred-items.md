# Deferred Items — Phase 15 (Befundlage & Vorlauf)

Out-of-scope discoveries found during plan execution, logged per the executor's
scope-boundary rule instead of auto-fixed (not directly caused by the task at hand).

## 1. [ERLEDIGT 2026-09-09] ROADMAP.md Erfolgskriterium 5 beschrieb eine bereits abgelehnte GATE-05-Reduktion

**Found during:** Plan 15-05, Task 3 (read_first las `.planning/PROJECT.md` § GATE-05)

**Issue:** `.planning/ROADMAP.md` Phase-15-Erfolgskriterium 5 (Zeile ~110) beschreibt die
Abnahmeform noch als "Stufe 3 menschlich — volle Runde nach den Phasen 16/17/18, gezielte
Stellenliste nach 15 und 19" (die von D-53 vorgeschlagene, reduzierte dreistufige Form).
`PROJECT.md` § GATE-05 dokumentiert jedoch, dass der Nutzer genau diese Reduktion per
Checkpoint-Entscheidung am 2026-09-09 **ABGELEHNT** hat — die verbindliche Form ist eine
volle Vier-Themes-Runde nach JEDER der fünf Phasen 15-19, ohne Verkürzung auf eine gezielte
Stellenliste. `ROADMAP.md` wurde dabei nicht nachgezogen.

**Warum nicht in diesem Plan behoben:** Plan 15-05 betrifft FIX-02/FIX-03 (Zauberplatz-Pips,
Würfelfarbe); die ROADMAP-Korrektur des Erfolgskriteriums 4 (Selektor-Konflikt) wurde vom
Orchestrator explizit als Teil dieses Plans benannt, Kriterium 5 nicht — die Diskrepanz wurde
nicht durch eine Änderung dieses Plans verursacht (Scope-Boundary-Regel: nur direkt vom
aktuellen Task verursachte Probleme werden automatisch behoben).

**Erledigt:** Der Orchestrator hat Erfolgskriterium 5 direkt nach Welle 3 auf die verbindliche
Form nachgezogen (fünf volle Vier-Themes-Runden, keine Reduktion), mit der D-53-Ablehnung als
sichtbarer Korrekturnotiz daneben. Ursache war die Reihenfolge: 15-03 schrieb das Kriterium,
bevor die Checkpoint-Antwort zu 15-02 vorlag.

**Ursprüngliche Empfehlung:** `.planning/ROADMAP.md` Phase-15-Erfolgskriterium 5 auf die in `PROJECT.md` §
GATE-05 dokumentierte, verbindliche Form (fünf volle Runden, eine nach jeder Phase, keine
Reduktion) nachziehen — z. B. als kleiner Dokumentations-Task in einem der verbleibenden
Phase-15-Pläne (15-06/15-07/15-08) oder vor `/gsd-verify-work 15`.

## Deferred Items

Zwei Restpunkte aus Plan 15-09 (CR-01/WR-01-Fix), bewusst nicht in dieser Phase behoben.

### 1. `renderCompactSpellSlots()` dupliziert `renderSpellSlotPips()` fast wörtlich (WR-02)

- **Status:** open
- **Quelle:** `15-REVIEW.md`, WR-02 (Code-Review), gefunden vor Plan 15-09, hier vertagt
- **Begründung:** `renderCompactSpellSlots()` in `features/party/party-render.js` dupliziert
  `renderSpellSlotPips()` fast wörtlich. Das ist ein Wartbarkeitsbefund ohne Verifikationslücke —
  keine der beiden Funktionen erzeugt eine falsche Aussage über toten oder lebendigen Code, und
  keine Sicherheits- oder Korrektheitseigenschaft hängt von der Duplikation ab. Eine
  Zusammenführung würde Produktionscode außerhalb des Gap-Closure-Umfangs dieses Plans anfassen
  (`files_modified` von 15-09 nennt weder `party-render.js` noch verwandte Dateien) und ist daher
  vertagt, nicht behoben.

### 2. Strukturelle Grenze der textbasierten Lebend-Erkennung ohne echten JS-Parser

- **Status:** open
- **Quelle:** `tools/css-usage-report.js`, Kopfkommentar zu `DEAD_EXCEPTIONS`; unverändert seit
  Plan 15-06, durch Plan 15-09s CR-01/WR-01-Fix nicht aufgehoben
- **Begründung:** Plan 15-09 hat drei mechanisch schließbare Erkennungslücken geschlossen
  (Ternary rechts von `.className=`, die Objektschlüssel `className:`/`containerClass:`, und die
  Klammertiefe in `classList.*()`-Aufrufen). Die verbleibende Grenze ist strukturell, nicht
  mechanisch schließbar: eine Text-Prüfung ohne echten JS-Parser kann eine Kette wie
  `setReadAloudFormat()`s Ternary auf einer Laufzeit-Variable, deren mögliche Werte nur in einer
  entfernten Dropdown-Optionsliste stehen, nie vollständig auflösen. Die fünf Read-Aloud-Einträge
  in `DEAD_EXCEPTIONS` (`crimson`, `violet`, `sage`, `sky`, `slate`) sind die heutige, handgeprüfte
  Ausprägung dieser Grenze. Vertagt, damit die Phasen 16 bis 19 wissen, dass das Werkzeug — auch
  nach diesem Fix — eine bekannte Restgrenze hat, die kein weiterer mechanischer Regel-Zusatz
  vollständig schließen kann; ein echter JS-Parser wäre eine architektonische Entscheidung (Rule 4),
  keine Wartungsroutine.

### 3. `npm run lint` bereits vor Plan 15-11 rot — unbeteiligte `Anpassungen/`-Datei

- **Status:** open
- **Quelle:** gefunden während Plan 15-11, Task 2 (Akzeptanzkriterium "`npm run lint` bleibt
  innerhalb seiner Warnungsgrenze")
- **Begründung:** `Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/support.js`
  (zuletzt geändert in Commit `05515de`, "start milestone v1.3 Design-System", lange vor Phase 15)
  wirft 5 `no-undef`-Fehler (`customElements`, `URLSearchParams`) und trägt zusammen mit anderen
  vorbestehenden Warnungen die Gesamtzahl auf 371 — über die in `package.json` gepinnte Grenze
  `--max-warnings 367`. Diese Datei ist in keinem `files_modified` dieses Plans genannt und wurde
  von keinem Commit dieser Phase berührt; `npx eslint tools/ tests/unit/css-usage-report.test.js`
  (nur die von diesem Plan geänderten Dateien) meldet 0 Probleme. Scope-Boundary-Regel: nicht
  behoben, da nicht durch diesen Task verursacht. Deckt sich mit dem bereits in `PROJECT.md` §
  NQ-03..NQ-11 dokumentierten Befund, dass die drei Gate-Ratschen (`--max-warnings 367` eine davon)
  reine Prosa-Regeln ohne Mechanik sind.

### 4. `renderNPCCard()` und ein Dice-Faerbungs-Rueckfallzweig sind unerreichbarer JS-Pfad

- **Status:** open
- **Quelle:** `15-REVIEW.md` CR-01, Punkte 5 und 6 (gefunden vor Plan 15-09, hier in Plan 15-12
  bei der Wiederherstellung der zugehoerigen CSS-Regeln bestaetigt)
- **Begründung:** `renderNPCCard()` in `ui/dom-builder.js` hat baumweit keinen Aufrufer — die
  Klasse `npc-header`, die sie setzt, ist per `containerClass:`-Objektschluessel dennoch als
  lebendig erkannt (der Text-Pruefung reicht die Zuweisung im toten Funktionskoerper). Ebenso
  schreibt der Rueckfallzweig in `features/dice/dice-core.js:374-382` (die `dice-crit`/`dice-fail`-
  Faerbung) auf ein Element, das in keiner Vorlage existiert. Plan 15-12 hat beide zugehoerigen
  CSS-Regelbloecke (`.npc-header` in `npcs.css`, `.dice-crit`/`.dice-fail` in `dashboard.css`)
  wörtlich wiederhergestellt statt den toten JS-Pfad zu loeschen: der Loeschgrund waere nicht
  "diese Klasse ist tot" (sie ist es nicht — das JS setzt sie), sondern "dieser JS-Pfad ist
  unerreichbar", und das ist ein anderer Befund mit anderem Pruefbedarf. Ihn in einer
  Luekenschluss-Welle nebenbei mitzuerledigen, hiesse dieselbe Ungeprueftheit zu wiederholen, die
  diesen Plan verursacht hat.

### 5. F-20-Ratsche in `design-consistency.test.js` ist eine Festschreibung statt einer Ratsche (WR-07)

- **Status:** open
- **Quelle:** `15-REVIEW.md` WR-07 und `15-VERIFICATION.md` (Anti-Pattern-Tabelle, Schweregrad
  Warnung)
- **Begründung:** Der zweite Testfall der F-20-Ratsche in `tests/unit/design-consistency.test.js`
  verlangt Gleichheit mit einer einelementigen Liste und ist damit eine Festschreibung, keine
  Ratsche. Die Review-Empfehlung (auf "falls ein Block existiert, steht er in `core.css`"
  umstellen) macht den Fall gegenueber einer legitimen kuenftigen Senkung auf null robust,
  schwaecht aber zugleich die in Truth 2 dieser Phase festgehaltene Aussage "genau ein globaler
  Block, in `core.css`" auf "hoechstens einer" ab — die Ratsche `<= 1` des ersten Falls deckt die
  Null-Untergrenze nicht. Vertagt, weil die Entscheidung eine Abwaegung ueber die verbindliche
  Form von MOTION-05 ist und nicht in einer Luekenschluss-Welle nebenbei getroffen werden sollte;
  die Phase, die die Bewegungsunterdrueckung tatsaechlich anfasst (Phase 17), ist der richtige
  Ort. `tests/unit/design-consistency.test.js` wurde in dieser Welle NICHT geaendert.

### 6. `collectConcatVarLiterals()` (Plan 15-11, CR-03b) erzeugt reproduzierbare Fehlalarme bei wiederverwendeten kurzen Bezeichnern

- **Status:** open
- **Quelle:** gefunden waehrend Plan 15-12, Task 1/2 (der volle Gegenprobe-Lauf nannte 22 statt
  der sechs aus `15-REVIEW.md` CR-01 erwarteten Klassenfamilien; 15 davon liessen sich per
  instrumentierter Nachverfolgung eindeutig auf dieselbe Ursache zurueckfuehren)
- **Begründung:** `collectConcatVarLiterals()`s anweisungsweiter Vorwaertsscan ab einem
  `class="..."`-Vorkommen (bis zu `MAX_SEGMENT_SCAN_CHARS` = 2000 Zeichen oder das naechste `;`,
  nur klammertiefen-/anfuehrungszeichen-gebunden, nicht statement-semantik-bewusst) kann in einer
  grossen, template-literal-zurueckgebenden Funktion mit verschachtelten Callbacks weit genug
  reichen, um einen VOELLIG UNABHAENGIGEN, spaeter im Dateiinhalt deklarierten Bezeichner
  aufzugreifen — ohne zu pruefen, ob tatsaechlich eine Verkettung in den Klassenwert stattfindet.
  Betroffene, konkret nachgewiesene Faelle (Bezeichner, Datei, tatsaechliche Bedeutung): `c`
  (`features/dice/dice-core.js`, zweimal — `$('dice-formula-history')` und `$('dice-history')`),
  `select`/`selectEl` (`features/dice/dice-core.js`, `$('dice-char-select')`), `searchEl`
  (`features/encounters/encounters-render.js`, `features/locations/locations-render.js`,
  `features/npcs/npc-render.js` — je eine `$('...-search')`-Element-ID-Referenz), `searchInput`
  (`features/initiative-loot.js`, `$('loot-search')`), `viewMap`/`allowedTypes`/`lookupMap`/
  `searchIn`/`existingRelations` (`systems/entity-links.js`, `systems/search/global-search.js`,
  `features/locations/locations-render.js`, `systems/tags.js`, `features/npcs/npc-render.js` —
  Typ-Name-Zuordnungen bzw. Suchfeld-/Beziehungslisten, keine Klassenwerte), `structureItems`
  (`ui/editors/editor-toolbar-build.js`), `c`/`nameInput`/`container` (`features/timers/timers.js`).
  Keine dieser 15 Klassen wird tatsaechlich per `class=`/`.className=`/`classList.*()`/
  `className:`/`containerClass:` einem Element zugewiesen (direkt gegengeprueft). Plan 15-12 hat
  diese 15 Namen deshalb NICHT als CSS wiederhergestellt (das haette genuinely-totes CSS erneut
  in den Baum geholt, teils sogar ausserhalb der `files_modified`-Dateien dieses Plans), sondern
  als datierte, einzeln begruendete Ausnahmeliste (`KNOWN_FALSE_POSITIVES`) direkt in
  `tests/unit/css-deletion-audit.test.js` gefuehrt — analog zu `DEAD_EXCEPTIONS` im Werkzeug
  selbst, aber OHNE das Werkzeug zu aendern (Planvorgabe dieser Welle). `tools/css-usage-report.js`
  selbst bleibt unangetastet; die eigentliche Korrektur (Konkatenation statt blosser
  Woertlich-Ko-Vorkommen im Anweisungsfenster verlangen) ist eine architektonische Aenderung
  (Rule 4) und gehoert in eine eigene, dedizierte Welle — nicht in eine Luekenschluss-Welle, die
  `tools/css-usage-report.js` explizit nicht aendern darf.
