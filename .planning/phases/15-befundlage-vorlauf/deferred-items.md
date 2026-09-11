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
