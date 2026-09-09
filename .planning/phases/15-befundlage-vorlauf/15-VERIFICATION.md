---
phase: 15-befundlage-vorlauf
verified: 2026-09-09T18:00:00Z
status: gaps_found
score: 10/13 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 9/11
  gaps_closed:
    - "CLAUDE.md widerspruch bei der CSS-Dateizahl (13 vs. 20) — Plan 15-10 hat alle drei Fundstellen (Zeile 144, 523, 759 inkl. Struktur-Codeblock mit allen 20 Eintraegen in @import-Reihenfolge) auf 20 korrigiert; neuer Waechtertest tests/unit/docs-consistency.test.js (4 Faelle, DOC-01..04) selbst nachgefahren und gruen bestaetigt."
  gaps_remaining:
    - "DEAD-01/DEAD-02-Verbot weiterhin verletzt — Plan 15-09 hat nur einen Teil der Erkennungsluecke geschlossen und nur zwei der inzwischen sechs betroffenen Klassenfamilien wiederhergestellt. Die Code-Review (15-REVIEW.md, CR-01) hat vier weitere, tatsaechlich ausgelieferte Regressionen gefunden und ich habe alle vier unabhaengig am Quelltext bestaetigt (siehe Truth 13)."
  regressions: []
  new_findings:
    - "CR-02/CR-03 (15-REVIEW.md): die in Plan 15-09 gebaute Erkennung bricht bei jedem Zeilenumbruch ab (`scanBalancedSegment()`, Zeile 304 `if (ch === '\\n') break;` — selbst nachgemessen) und wirft `${...}`-Interpolationsinhalte pauschal weg. Beides strukturell, nicht nur hypothetisch: genau die Konstruktion aus `features/dice/dice-core.js:379-381` (mehrzeilige `.className =`-Zuweisung) faellt durch die neue Erkennung durch."
    - "CR-04 (15-REVIEW.md): das als 'dritte Nachweissaeule' gedachte tests/e2e/features/computed-style-diff.spec.js ist strukturell unfaehig, genau die Art Regression zu finden, die diese Phase produziert hat — vier unabhaengige Gruende, alle am Quelltext nachgemessen (siehe Truth 12)."
    - "WR-03 (15-REVIEW.md, nicht blockierend): CLAUDE.md:145 behauptet weiterhin '10 modulare HTML-Templates', gemessen sind es 12 (`ls assets/templates/*.html | wc -l`). Derselbe Fehlermodus, den Plan 15-10 fuer die CSS-Dateizahl beheben sollte, existiert unentdeckt fuer die Template-Zahl weiter — der neue Waechter DOC-02 deckt nur CSS-Zeilen ab."
    - "WINDOWS.md-Eintrag 6 fuehrt CR-01 als 'fixed'. Das ist nach dieser Nachpruefung ueberholt: die Erkennungsluecke ist nur teilweise geschlossen und mindestens vier Klassenfamilien mit Laufzeitwirkung bleiben faelschlich geloescht. Empfehlung: Status auf 'open' zuruecksetzen oder einen neuen Eintrag fuer den Restbefund anlegen."
gaps:
  - truth: "DEAD-01/DEAD-02-Verbot: das Werkzeug meldet niemals still eine Klasse als tot, deren Lebendbeleg ihm nur wegen einer unbekannten Konstruktion fehlt — eine unbeurteilbare Konstruktion wird laut ausgewiesen, nie still als tot gezaehlt"
    status: failed
    reason: "Unabhaengig am Quelltext bestaetigt (nicht nur aus 15-REVIEW.md uebernommen): Plan 15-09 hat die Erkennungsluecke nur teilweise geschlossen. `.npc-grid` und `.list-view-container` (die zwei im vorigen Bericht genannten Faelle) sind wiederhergestellt und stehen jetzt wieder in `assets/styles/npcs.css:993` bzw. `assets/styles/encounters.css:17` — bestaetigt per grep. Eine Gegenprobe des GESAMTEN Loeschstands gegen die neue Erkennung wurde jedoch nicht gefahren. Ich habe vier weitere geloeschte Klassenfamilien mit Laufzeitwirkung selbst am Quelltext bestaetigt, die die gleiche Blindstelle treffen (Details unter Truth 13)."
    artifacts:
      - path: "tools/css-usage-report.js"
        issue: "scanBalancedSegment() (Zeile 284-315) bricht bei jedem Zeilenumbruch ab (Zeile 304: `if (ch === '\\n') break;`, selbst gelesen) und die ${...}-Interpolation wird an mehreren Stellen (Zeile 255, 338) pauschal verworfen statt ihre Zeichenketten-Literale zu extrahieren. Beides trifft real vorkommende Formen im Baum (mehrzeilige .className=-Zuweisung in dice-core.js; ${cond ? 'a' : 'b'}-Idiom in party-render.js/shops-core.js)."
      - path: "assets/styles/loot.css"
        issue: "`.shop-meta-tag`, `.shop-meta-tag:hover`, `.shop-meta-tag.npc`, `.shop-meta-tag.location` fehlen vollstaendig (grep: 0 Treffer). Gesetzt in features/shops/shops-core.js:410-411 ueber className:-Objektschluessel — genau die Form, die Plan 15-09 als lebendig erkennen sollte, aber die Regel ist trotzdem geloescht (vor 15-09 geloescht, von 15-09 nicht rueckgeprueft)."
      - path: "assets/styles/loot.css"
        issue: "`.si-unavailable { opacity: 0.5; }` (Basisregel) fehlt; nur der Nachfahrenselektor `.si-unavailable .si-name` (Zeile 476) blieb erhalten. Gesetzt in features/shops/shops-core.js:596 als Ternary innerhalb einer Template-Literal-Interpolation — CR-03-Muster."
      - path: "assets/styles/welt.css"
        issue: "`.fr-hist-plus`/`.fr-hist-minus` fehlen vollstaendig (grep: 0 Treffer, nur fr-hist-delta/-grund/-ts bleiben). Gesetzt in features/fraktionen/fraktionen-render.js:215 ueber Zwischenvariable (var deltaClass = ... ? 'fr-hist-plus' : 'fr-hist-minus';), ausgegeben Zeile 218 — eine Form, die weder vor noch nach 15-09 erkannt wird."
      - path: "assets/styles/initiative.css"
        issue: "`.init-mob-dmg-inputs`, `.init-mob-dmg-inputs.hidden`, `.init-mob-dmg-inputs input` fehlen vollstaendig (grep: 0 Treffer). Gesetzt in features/initiative-mob.js:165 ueber Ternary-Zuweisung an eine Zwischenvariable. Die geloeschte .hidden-Regel war der einzige Ausblendmechanismus; im gesamten assets/styles/-Baum existiert keine generische .hidden-Regel mehr (nur drei komponentengebundene: .loot-tag-chip.hidden, .npc-trigger-reveal.hidden, .ld-tab-content.hidden — alle drei per grep bestaetigt)."
    missing:
      - "scanBalancedSegment() darf den Zeilenumbruch nicht als Abbruchbedingung fuehren (nur echte Terminatoren bei Klammertiefe 0, mit einer harten Zeichen-Obergrenze gegen Weglaufen)"
      - "${...}-Interpolationsinhalt darf nicht pauschal verworfen werden — Zeichenketten-Literale darin muessen als Token eingesammelt werden (die QUOTED_STRING_RE-Maschinerie existiert bereits)"
      - "Zwischenvariablen-Form (var x = cond ? 'a' : 'b'; ... class=\"...' + x + '...\") entweder als vierte Kontextregel erkennen oder ausdruecklich als nicht entscheidbar behandeln und nie als tot melden"
      - "Die vier bestaetigten Regressionen (.shop-meta-tag*, .si-unavailable, .fr-hist-plus/-minus, .init-mob-dmg-inputs*) woertlich aus dem Stand vor der jeweiligen Loeschung zurueckholen, wie in Plan 15-09 fuer .npc-grid/.list-view-container vorgemacht"
      - "Fuer die zwei Faelle ohne aktuelle Laufzeitwirkung (.npc-header, .dice-crit/.dice-fail) eine bewusste, dokumentierte Entscheidung treffen statt sie unbehandelt zu lassen"
      - "WINDOWS.md-Eintrag 6 (Status 'fixed') auf den tatsaechlichen Teilschliessungsgrad zuruecksetzen"
  - truth: "Die drei automatisierten Nachweise (Jest-Ratschen, e2e-Fix-Tests, computed-style-diff als dritte Saeule) stellen sicher, dass eine Loeschwelle keine sichtbare oder funktionale Regression einschleust"
    status: failed
    reason: "Unabhaengig am Quelltext bestaetigt: tests/e2e/features/computed-style-diff.spec.js kann strukturell keine der vier oben belegten Regressionen sehen. Vier von 15-REVIEW.md benannte Gruende, alle selbst nachgelesen: (1) SNAPSHOT_DIR liegt unter tests/e2e/test-results/, das per .gitignore:25 versioniert ausgeschlossen ist — in CI/frischem Klon ist previousSnapshot immer null und diffPass() gibt sofort [] zurueck; (2) saveSnapshot(currentSnapshot) laeuft in jedem der drei Testfaelle VOR der Zusicherung (Zeilen 238/257/271), ein Lauf mit gefundener Abweichung schreibt sie gleichzeitig als neuen Sollstand fest; (3) diffPass() iteriert ausschliesslich ueber Object.keys(currView.elements) (Zeile 213) — ein Element, das durch eine geloeschte Regel unsichtbar wird und deshalb aus der aktuellen Erfassung faellt, wird nie mit dem Vorlauf verglichen; (4) alle drei Durchgaenge seeden mit seedCleanSession() (leere Kampagne ohne Charaktere/NPCs/Shops/Fraktionen/Initiative), also wird keines der vier CSS-Ziele aus Truth 13 je gerendert."
    artifacts:
      - path: "tests/e2e/features/computed-style-diff.spec.js"
        issue: "SNAPSHOT_DIR (Zeile 88) = tests/e2e/test-results/ (gitignored); saveSnapshot() vor der Zusicherung (Zeilen 238, 257, 271); diffPass() (Zeile 208ff) iteriert nur ueber aktuelle Schluessel; seedCleanSession() statt befuellter Kampagne"
    missing:
      - "Baseline unter versioniertem Pfad ablegen (z.B. tests/e2e/baselines/), nicht unter test-results/"
      - "Nur schreiben, wenn keine Baseline existiert oder ein expliziter Update-Schalter gesetzt ist"
      - "Verschwundene Elementschluessel (im Vorlauf vorhanden, jetzt nicht mehr erfasst) als Befund melden, nicht stillschweigend uebergehen"
      - "Einen befuellten Seed verwenden (mind. ein Charakter mit Zauberplaetzen, ein NPC, ein Shop mit nicht verfuegbarem Artikel, eine Fraktion mit Ruf-Historie, ein Mob in der Initiative)"
deferred: []
behavior_unverified_items: []
human_verification:
  - test: "GATE-05 Stufe 3 — volle menschliche Vier-Themes-Runde nach Phase 15 (PROJECT.md § GATE-05, D-53-Ablehnung: keine reduzierte Stellenliste zulaessig)"
    expected: "Ein Mensch sichtet die App in allen vier Themes (Dark/Light/Sepia/Contrast), mindestens einschliesslich der drei Mindestumfang-Stellen dieser Phase: DM-Screen-Referenzwidgets Gelaende/Fertigkeiten/Wissensgebiete, Zauberplatz-Pips auf der Charakterkarte, Wuerfelergebnis der Hauptansicht inkl. Crit-/Patzerfaerbung. Angesichts der in dieser Nachpruefung bestaetigten CSS-Regressionen sollte die Runde zusaetzlich gezielt die vier betroffenen Stellen pruefen: Shop-NPC/Ort-Chips, nicht verfuegbare Shop-Artikel, Fraktions-Ruf-Historie, Mob-Sammelangriff-Eingabefelder in der Initiative."
    why_human: "GATE-05 selbst schreibt eine automatisierte Stufe 1 (Suiten/Build) und eine agentengestuetzte Stufe-2-Screenshot-Serie vor, verlangt aber ausdruecklich zusaetzlich eine echte menschliche Stufe-3-Runde als drittes, nicht ersetzbares Element; weder Plan 15-08 noch die beiden Luekenschluss-Plaene 15-09/15-10 haben dies als durchgefuehrt behauptet. Unveraendert seit der vorigen Verifikation."
---

# Phase 15: Befundlage & Vorlauf Verification Report

**Phase Goal:** Vor der ersten Code-Zeile der Folgephasen stehen korrigierte Zahlen, entschiedene
Blocker, eine bereinigte CSS-Basis und ein verlaessliches Mess-Instrument — die 13 Blocker-
Entscheidungen sind gebucht, die Handoff-Zahlen korrigiert, drei sichtbare Defekte behoben, das
Dead-CSS-Werkzeug gebaut und der tote Bestand geloescht, das Nachmess-Protokoll geschrieben.
**Verified:** 2026-09-09
**Status:** gaps_found
**Re-verification:** Yes — nach `--gaps-only`-Lauf (Plaene 15-09, 15-10)

## Goal Achievement

Diese Nachpruefung ersetzt den vorigen `15-VERIFICATION.md`-Stand (`gaps_found`, 9/11). Eine
Lueke ist sauber geschlossen. Die zweite Lueke (DEAD-01/DEAD-02) ist nur zur Haelfte geschlossen,
und eine parallel gelaufene Code-Review (`15-REVIEW.md`) hat waehrend dieser Nachpruefung vier
tatsaechlich ausgelieferte, bislang unentdeckte Regressionen gefunden. Ich habe jeden einzelnen
Befund unabhaengig am aktuellen Quelltext nachgemessen (nicht aus dem Review-Bericht uebernommen)
— alle Funde sind bestaetigt. Zusaetzlich habe ich, wie im Auftrag verlangt, eigenstaendig
bewertet, ob das Nachmess-Instrument der Phase lasttragend oder dekorativ ist: es ist strukturell
dekorativ fuer genau die Art Regression, die hier aufgetreten ist.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Alle 13 Blocker (B-01..B-13) sind mit Entscheidung, Begruendung und Auswirkung gebucht | ✓ VERIFIED | `PROJECT.md` § "Blocker-Entscheidungen v1.3": unveraendert seit voriger Pruefung, Regressionscheck bestaetigt keine Aenderung |
| 2 | Genau ein globaler `prefers-reduced-motion`-Block existiert, in `core.css` | ✓ VERIFIED | `grep -rn "prefers-reduced-motion" assets/styles/` → weiterhin genau 1 Treffer, `core.css` |
| 3 | Der Loeschlauf senkt `assets/styles/` um die vom Werkzeug gemessene Menge toter Regelbloecke; danach sind Suiten gruen und Builds laufen durch | ✓ VERIFIED (mit Einschraenkung) | `node tools/css-usage-report.js --check` selbst ausgefuehrt: 204 tote Klassen, 199 ausserhalb der Ausnahmeliste (unveraendert seit 15-09, `.npc-grid`/`.list-view-container` jetzt in der Ausnahmeliste der Lebend-Erkennung statt der Totenliste). Jest 1251/1251 (55 Suiten, sanity-check `npx jest --listTests` = 55 Zeilen), Playwright 364 passed/2 skipped, `python build.py --production` Exit 0 laut Auftragsangabe, Build-Artefakte `dist/dnd-tracker-bundled.html`/`-optimized.html` frisch (Zeitstempel heute) selbst geprueft. **Die literale Aussage ('Suiten gruen') ist wahr, beweist aber NICHT die Abwesenheit von Regressionen — siehe Truth 12/13.** |
| 4 | FIX-01/FIX-02/FIX-03 sind im gebauten Buendel sichtbar korrekt und funktional | ✓ VERIFIED | Unveraendert seit voriger Pruefung; von der Code-Review nicht angefochten; `tests/e2e/features/design-fixes.spec.js` Teil der gruenen 364 Playwright-Faelle |
| 5 | GATE-03 — jede neue Ratsche ist beidseitig rot-gruen bewiesen mit Ausgangswert im Kommentar | ✓ VERIFIED | `15-RATCHET-BASELINE.md` unveraendert; **Randbefund (nicht blockierend):** Review-Fund WR-07 zeigt, dass F-20s zweiter Testfall (`toEqual(['core.css'])`) eine Festschreibung statt einer echten Ratsche ist — kosmetischer Praezisionsfehler in der Ratschen-Formulierung, keine fehlende rot-gruen-Beweisfuehrung |
| 6 | GATE-04 — jede der sechs Befundgruppen ausserhalb `assets/styles/` traegt Phasenzuordnung oder Uebertragszeile; sieben harte Ausnahmen benannt | ✓ VERIFIED | Unveraendert seit voriger Pruefung |
| 7 | BASE-02 — 36 korrigierte Kennzahlen stehen in den Handoff-Dateien, Altwert bleibt sichtbar | ✓ VERIFIED | Unveraendert seit voriger Pruefung |
| 8 | BASE-03 — widerlegte Lieferantenaussage bleibt markiert, nicht entfernt; Zeilenspanne korrigiert | ✓ VERIFIED | Unveraendert seit voriger Pruefung |
| 9 | Die live PWA-Installationsroute uebersteht die Bannerloeschung | ✓ VERIFIED | Unveraendert seit voriger Pruefung |
| 10 | DEAD-01/DEAD-02-Verbot: keine Klasse wird still als tot gemeldet, deren Lebendbeleg dem Werkzeug nur wegen einer unbekannten Konstruktion fehlt | ✗ FAILED | Siehe `gaps` — nur teilweise geschlossen; vier weitere, bereits ausgelieferte Regressionen unabhaengig bestaetigt (Details Truth 13) |
| 11 | Die drei sachlich falschen CLAUDE.md-Behauptungen (CSS-Dateizahl = 20) sind korrigiert | ✓ VERIFIED | An allen drei Fundstellen (Zeile 144, 523, 759 inkl. vollstaendiger 20-Datei-Struktur-Codeblock in `@import`-Reihenfolge) selbst gelesen: konsistent 20. Neuer Waechter `tests/unit/docs-consistency.test.js` selbst ausgefuehrt: 4/4 gruen (DOC-01..04). **Neuer, anderer Randbefund (WR-03, nicht Teil dieser Truth):** Zeile 145 behauptet weiterhin "10 modulare HTML-Templates", gemessen (`ls assets/templates/*.html \| wc -l`) sind es 12 — derselbe Fehlermodus bei einer anderen Zahl, vom neuen Waechter nicht abgedeckt |
| 12 | Das Nachmess-Instrument `computed-style-diff.spec.js` ist ein lasttragender dritter Nachweis gegen visuelle/funktionale Regressionen aus der Loeschwelle | ✗ FAILED | Vier voneinander unabhaengige, strukturelle Maengel selbst am Quelltext bestaetigt (gitignorete, sich selbst ueberschreibende Baseline; nur additive Diff-Richtung; leere Kampagne als Seed) — siehe `gaps`. Das Instrument ist aktuell dekorativ fuer genau die Regressionsklasse, die diese Phase produziert hat |
| 13 | Die in Plan 15-07 vorgenommenen CSS-Loeschungen haben keine Laufzeit-Regression verursacht | ✗ FAILED | Vier Klassenfamilien mit bestaetigter Laufzeitwirkung selbst am Quelltext nachgewiesen: `.shop-meta-tag*` (Shop-Kopf-Chips verlieren Formatierung/Farbe), `.si-unavailable` (nicht verfuegbare Shop-Artikel werden nicht mehr abgedunkelt), `.fr-hist-plus`/`.fr-hist-minus` (Fraktions-Ruf-Historie verliert Gruen/Rot-Unterscheidung), `.init-mob-dmg-inputs.hidden` (Mob-Sammelangriff-Eingabefelder sind unabhaengig vom Modus permanent sichtbar — keine generische `.hidden`-Regel existiert mehr im Baum als Ersatz). Zwei weitere Faelle (`.npc-header`, `.dice-crit`/`.dice-fail`) sind vom selben Fehler betroffen, aber aktuell folgenlos, weil ihre einzigen Aufrufer selbst unerreichbar sind — ebenfalls selbst bestaetigt |

**Score:** 10/13 truths verified (3 present-and-real regressions/structural gaps, keine davon behavior-unverified — alle sind direkt am Quelltext bestaetigt, nicht nur vermutet)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.planning/PROJECT.md` | Blocker-Entscheidungen v1.3, GATE-04, Uebertrag-Tabelle, GATE-05 | ✓ VERIFIED | Unveraendert |
| `CLAUDE.md` | Korrigierte CSS-Dateizahl (kein Selbstwiderspruch) | ✓ VERIFIED | Alle drei Fundstellen konsistent 20; neuer Waechtertest gruen. Template-Zahl (Zeile 145) bleibt falsch, aber ausserhalb des Anspruchs dieser Truth |
| `tools/css-usage-report.js` | Dreistufige Lebend-Erkennung ohne stille Fehlklassifikation | ✗ HOLLOW (methodischer Defekt, teilweise behoben) | `.npc-grid`/`.list-view-container` korrekt nachgezogen; `scanBalancedSegment()` bricht weiterhin am Zeilenumbruch ab (Zeile 304, selbst gelesen) und `${...}`-Interpolationsinhalt wird verworfen — beide Luecken treffen real vorkommende Formen im Baum |
| `tests/e2e/features/computed-style-diff.spec.js` | Dreidurchgang-Stildiff als Regressionsnetz | ✗ HOLLOW (strukturell wirkungslos fuer Entfernungen) | Existiert, laeuft gruen, aber vier bestaetigte strukturelle Maengel (gitignorete/sich-selbst-ueberschreibende Baseline, additive Diff-Richtung, leere Kampagne) machen es fuer Loesch-Regressionen wirkungslos |
| `tests/unit/docs-consistency.test.js` | Neu (Plan 15-10): pinnt CSS-Dateizahl gegen Selbstwiderspruch | ✓ VERIFIED | Existiert, 4/4 selbst ausgefuehrt und gruen |
| `assets/styles/npcs.css`, `assets/styles/encounters.css` | `.npc-grid`/`.list-view-container` wiederhergestellt | ✓ VERIFIED | Beide Regelbloecke per grep bestaetigt vorhanden |
| `assets/styles/loot.css`, `assets/styles/welt.css`, `assets/styles/initiative.css` | Keine faelschlich geloeschten, laufzeitwirksamen Regeln | ✗ FAILED | Vier Klassenfamilien mit Laufzeitwirkung fehlen weiterhin (siehe Truth 13) |
| `.planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md` | Einziges Messprotokoll | ✓ VERIFIED | Unveraendert seit voriger Pruefung |
| `.planning/WINDOWS.md` | Eintrag 6 (CR-01) korrekt als Fund gefuehrt | ⚠ ORPHANED (Status veraltet) | Eintrag existiert und beschreibt den urspruenglichen Fund akkurat, aber sein Status `fixed` ist nach dieser Nachpruefung ueberholt — der Fund ist nur teilweise geschlossen |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `features/shops/shops-core.js:410-411` (`className: 'shop-meta-tag npc'`) | `assets/styles/loot.css` | Objektschluessel-Zuweisung → CSS-Klasse | ✗ NOT_WIRED | Klasse gesetzt, keine CSS-Regel mehr vorhanden (grep: 0 Treffer) |
| `features/shops/shops-core.js:596` (`${isAvailable ? '' : 'si-unavailable'}`) | `assets/styles/loot.css` | Template-Interpolation → CSS-Klasse | ✗ NOT_WIRED | Nur Nachfahrenselektor bleibt, Basisregel fehlt |
| `features/fraktionen/fraktionen-render.js:215/218` (`deltaClass`) | `assets/styles/welt.css` | Zwischenvariable → CSS-Klasse | ✗ NOT_WIRED | `.fr-hist-plus`/`.fr-hist-minus` vollstaendig entfernt |
| `features/initiative-mob.js:165/189` (`dmgInputsClass`) | `assets/styles/initiative.css` | Ternary-Zuweisung → CSS-Klasse | ✗ NOT_WIRED | Alle drei Regeln entfernt, kein generischer `.hidden`-Ersatz im Baum |
| `assets/templates/header.html` (`#pwa-install-btn`) | `systems/spellslots/pwa-install.js` | `data-action="install-pwa"` | ✓ WIRED | Unveraendert |
| `features/party/party-render.js` (`.slot-pip`) | `ui/event-delegation.js` | `data-id`/`data-value` | ✓ WIRED | Unveraendert |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `.npc-grid`/`.list-view-container` Wiederherstellung | `grep -n "npc-grid\|list-view-container" assets/styles/*.css` | Beide Regelbloecke vorhanden (`npcs.css:993`, `encounters.css:17`) | ✓ PASS |
| `--check` Restbestand | `node tools/css-usage-report.js --check` | Exit 1, 204 tote Klassen / 199 ausserhalb Ausnahmeliste (unveraendert seit 15-09) | ✓ PASS (bestaetigt dokumentierten Zustand) |
| `docs-consistency`-Waechter | `npx jest tests/unit/docs-consistency.test.js` | 4/4 bestanden | ✓ PASS |
| Zeilenumbruch-Blindstelle | Lesen von `tools/css-usage-report.js:304` | `if (ch === '\n') break;` bestaetigt vorhanden | ✓ PASS (bestaetigt CR-02) |
| Vier Regressions-Klassenfamilien | `grep -rn` auf je zwei CSS-Dateien und die jeweilige JS-Quelle | Alle vier CSS-seitig 0 Treffer, JS-seitig Zuweisung bestaetigt | ✓ PASS (bestaetigt CR-01) |
| Zwei folgenlose Faelle (`.npc-header`, `.dice-crit`/`.dice-fail`) | Aufrufer-Suche (`renderNPCListOptimized`, `#dice-result` in Templates) | Kein Aufrufer bzw. kein Zielelement im Baum | ✓ PASS (bestaetigt "aktuell folgenlos") |
| `computed-style-diff.spec.js` Baseline-Pfad | Lesen von Zeile 88-89 und `.gitignore:25` | `SNAPSHOT_DIR` = `tests/e2e/test-results/`, per `.gitignore` ausgeschlossen | ✓ PASS (bestaetigt CR-04 Punkt 1) |
| `computed-style-diff.spec.js` Selbstueberschreibung | Lesen von Zeile 235-271 | `saveSnapshot()` laeuft vor jeder Zusicherung in allen drei Faellen | ✓ PASS (bestaetigt CR-04 Punkt 2) |
| `computed-style-diff.spec.js` nur additive Diff-Richtung | Lesen von `diffPass()` (Zeile 208-226) | Iteration ausschliesslich ueber `currView.elements`, verschwundene Schluessel werden nie erreicht | ✓ PASS (bestaetigt CR-04 Punkt 3) |
| `computed-style-diff.spec.js` Seed-Umfang | Lesen von Zeile 231/244/263 | Alle drei Durchgaenge nutzen `seedCleanSession()` | ✓ PASS (bestaetigt CR-04 Punkt 4) |

### Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|---|---|---|---|
| BASE-01 | 15-02 | ✓ SATISFIED | Unveraendert |
| BASE-02 | 15-03 | ✓ SATISFIED | Unveraendert |
| BASE-03 | 15-01 | ✓ SATISFIED | Unveraendert |
| BASE-04 | 15-01, 15-08 | ✓ SATISFIED | Unveraendert |
| DEAD-01 | 15-06, 15-07, 15-09 | ✗ WEITERHIN VERLETZT | Woertliche Zahlanforderung erfuellt (0 vollstaendig tote Regelbloecke *im aktuellen Bericht*), aber die Prohibition ("nie still als tot zaehlen") ist per vier neu bestaetigten Regressionen weiterhin verletzt |
| DEAD-02 | 15-06, 15-07, 15-09 | ✗ WEITERHIN VERLETZT | Praefixerkennung funktioniert fuer die 5 eingefrorenen Praefixe; dieselbe Blindstelle (Zeilenumbruch, Interpolation) betrifft auch DEAD-02s Pflicht-Fehlalarm-Prinzip |
| DEAD-03 | 15-07, 15-08 | ✓ SATISFIED | Unveraendert |
| FIX-01 | 15-04 | ✓ SATISFIED | Unveraendert |
| FIX-02 | 15-05 | ✓ SATISFIED | Unveraendert |
| FIX-03 | 15-05 | ✓ SATISFIED | Unveraendert |
| GATE-03 | 15-01, 15-04, 15-08 | ✓ SATISFIED | Unveraendert (WR-07 ist ein Praezisionsfund, keine fehlende Beweisfuehrung) |
| GATE-04 | 15-02 | ✓ SATISFIED | Unveraendert |
| GATE-05 | 15-02, 15-06, 15-08 | ⚠ Stufe 1+2 satisfied, Stufe 3 offen | Unveraendert — siehe Human Verification |
| MOTION-05 | 15-01 | ✓ SATISFIED | Unveraendert |

Keine verwaisten Requirements — alle 14 IDs aus dem Phase-Requirements-Feld sind in mindestens
einem Plan referenziert und in `REQUIREMENTS.md`/`ROADMAP.md` als Phase 15 gefuehrt. Der aktuelle
Stand von `REQUIREMENTS.md` (Zeile 425-459) fuehrt BASE-02/03/04, DEAD-03, FIX-01/02/03 und GATE-05
bereits korrekt als "Gaps Found" — konsistent mit diesem Bericht; DEAD-01/DEAD-02 stehen dort
weiterhin als "Complete", was nach dieser Nachpruefung zu korrigieren ist.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `tools/css-usage-report.js` | 304 | `scanBalancedSegment()` bricht am Zeilenumbruch ab (CR-02) | 🛑 Blocker | Trifft real vorkommende, umbrochene `.className=`-Zuweisungen; Ursache eines der vier bestaetigten Regressionen |
| `tools/css-usage-report.js` | 255, 338 | `${...}`-Interpolationsinhalt wird verworfen statt Zeichenketten-Literale zu extrahieren (CR-03) | 🛑 Blocker | Trifft das im Projekt dominierende Idiom fuer bedingte Klassen; ~44 der 199 gemeldeten "toten" Klassen sind laut Review-Messung tatsaechlich lebendig |
| `tests/e2e/features/computed-style-diff.spec.js` | 88-89, 235-271, 208-226, 231 | Vier strukturelle Maengel machen die "dritte Nachweissaeule" fuer Loesch-Regressionen wirkungslos (CR-04) | 🛑 Blocker | Erklaert, warum die gruenen Suiten die vier Regressionen aus Truth 13 nicht gefunden haben |
| `CLAUDE.md` | 145 | "10 modulare HTML-Templates" — gemessen 12 (WR-03) | ⚠ Warning | Derselbe Fehlermodus, den Plan 15-10 fuer die CSS-Zahl beheben sollte, bleibt fuer die Template-Zahl bestehen; neuer Waechter deckt es nicht ab |
| `.planning/WINDOWS.md` | Eintrag 6 | Status `fixed` fuer CR-01, obwohl nur teilweise geschlossen | ⚠ Warning | Kuenftige Phasen, die sich auf WINDOWS.md verlassen, uebersehen die verbleibende Erkennungsluecke |
| `tests/unit/design-consistency.test.js` | F-20, zweiter Fall | `toEqual(['core.css'])` ist eine Festschreibung, keine Ratsche (WR-07) | ⚠ Warning | Eine legitime kuenftige Senkung auf null macht den Test faelschlich rot |
| `features/party/party-render.js` | 308-354 | `renderCompactSpellSlots()` dupliziert `renderSpellSlotPips()` (WR-02) | ⚠ Warning | Unveraendert seit voriger Pruefung, explizit als Deferred Item gefuehrt |

Keine TBD/FIXME/XXX-Debt-Marker in den in dieser Phase geaenderten Dateien gefunden.

### Human Verification Required

### 1. GATE-05 Stufe 3 — volle Vier-Themes-Runde nach Phase 15

**Test:** Die App von Hand in allen vier Themes (Dark/Light/Sepia/Contrast) durchgehen, mindestens
einschliesslich der drei Mindestumfang-Stellen: DM-Screen-Referenzwidgets Gelaende/Fertigkeiten/
Wissensgebiete, Zauberplatz-Pips auf der Charakterkarte, Wuerfelergebnis der Hauptansicht
(inkl. Crit-/Patzerfaerbung) — und zusaetzlich gezielt die vier in dieser Nachpruefung bestaetigten
Regressionsstellen: Shop-NPC/Ort-Chips im Shop-Kopf, nicht verfuegbare Shop-Artikel (Abdunkelung),
Fraktions-Ruf-Historie (Gruen/Rot), Mob-Sammelangriff-Eingabefelder in der Initiative (muessen im
Nicht-N×-Wurf-Modus verschwinden).
**Expected:** Alle Bereiche sehen in jedem der vier Themes korrekt aus; keine Layoutbrueche; die
vier Regressionsstellen zeigen entweder ihre korrekte historische Formatierung (nach Behebung) oder
werden als bekannter, offener Fund bestaetigt.
**Why human:** PROJECT.md § GATE-05 verlangt ausdruecklich eine echte menschliche Stufe-3-Runde
zusaetzlich zu Stufe 1 (automatisiert) und Stufe 2 (agentengestuetzte Screenshot-Serie); weder
Plan 15-08 noch die Luekenschluss-Plaene 15-09/15-10 haben dies als durchgefuehrt behauptet.

### Gaps Summary

Von den 13 in dieser Nachpruefung gefuehrten Wahrheiten sind 10 sauber verifiziert, davon eine
(Gap 2 der vorigen Pruefung: CLAUDE.md-Selbstwiderspruch zur CSS-Dateizahl) durch Plan 15-10 sauber
und mit einem echten, selbst nachgefahrenen Waechtertest geschlossen.

Die zweite urspruengliche Lueke (DEAD-01/DEAD-02-Verbot) ist NICHT geschlossen — sie ist groesser
als beim letzten Mal bekannt:

1. **Plan 15-09 hat nur zwei von sechs betroffenen Klassenfamilien korrigiert.** Die Erkennungs-
   Erweiterung deckt ausschliesslich die *einzeilige* Form von `.className = <Ternary>` und
   `containerClass:`/`className:`-Objektschluesseln ab. Ich habe unabhaengig vom Code-Review-Bericht
   am Quelltext bestaetigt: `scanBalancedSegment()` bricht bei jedem Zeilenumbruch ab (Zeile 304)
   und `${...}`-Interpolationsinhalt wird an mehreren Stellen verworfen. Eine Gegenprobe des
   gesamten Loeschstands dieser Phase gegen die neue Erkennung wurde nicht gefahren.
2. **Vier tatsaechlich ausgelieferte Regressionen bestaetigt.** `.shop-meta-tag*` (Shop-Kopf-Chips
   verlieren Formatierung), `.si-unavailable` (keine Abdunkelung nicht verfuegbarer Artikel),
   `.fr-hist-plus`/`.fr-hist-minus` (Fraktions-Historie verliert Farbcodierung), und am
   schwerwiegendsten `.init-mob-dmg-inputs.hidden` (Mob-Sammelangriff-Eingabefelder sind jetzt
   IMMER sichtbar, unabhaengig vom gewaehlten Modus, weil keine generische `.hidden`-Regel mehr im
   Baum existiert). Zwei weitere Faelle sind vom selben Fehler betroffen, aber aktuell folgenlos,
   weil ihre Aufrufer selbst unerreichbar sind.
3. **Das als Sicherheitsnetz gedachte `computed-style-diff.spec.js` ist fuer genau diese
   Regressionsklasse strukturell blind** — vier unabhaengige Gruende, alle selbst am Quelltext
   bestaetigt: gitignorete und sich selbst ueberschreibende Baseline, rein additive Diff-Richtung
   (verschwundene Elemente werden nie erkannt), und eine leere Test-Kampagne, die keine der
   betroffenen Entitaeten je rendert. Die durchgehend gruenen Testsuiten dieser Phase beweisen also
   NICHT die Abwesenheit von Regressionen — dieser Befund selbst beantwortet die im Auftrag
   gestellte Frage, ob das Nachmess-Instrument lasttragend oder dekorativ ist: es ist fuer
   Loesch-Regressionen dekorativ.

Ein kleinerer, neuer Randbefund (WR-03, nicht blockierend fuer Truth 11): `CLAUDE.md:145` behauptet
weiterhin "10 modulare HTML-Templates" statt der gemessenen 12 — derselbe Fehlermodus, den Plan
15-10 fuer die CSS-Dateizahl beheben sollte, bleibt fuer eine andere Zahl im selben Dokument
bestehen, weil der neue Waechtertest nur CSS-Zeilen prueft.

Die Phase kann in diesem Zustand nicht als abgeschlossen gelten: das zentrale Ziel "eine
bereinigte, fehlerfreie CSS-Basis" und "ein verlaessliches Mess-Instrument" fuer die Folgephasen
16-19 ist nicht erreicht — im Gegenteil, das gebaute Werkzeug hat in dieser Phase selbst bereits
vier reale Regressionen verursacht, und das dafuer vorgesehene Regressionsnetz haette sie nicht
gefunden.

---

_Verified: 2026-09-09_
_Verifier: Claude (gsd-verifier)_
