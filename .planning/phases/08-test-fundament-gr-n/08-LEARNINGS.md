---
phase: 8
phase_name: "Test-Fundament grün"
project: "D&D Kampagnen-Tracker Pro"
generated: "2026-07-27"
counts:
  decisions: 5
  lessons: 6
  patterns: 4
  surprises: 4
missing_artifacts:
  - "08-UAT.md (keine UAT-Session für diese Phase)"
---

# Phase 8 — Learnings: Test-Fundament grün

## Decisions

**Banner-Offset über eine JS-gemessene CSS-Custom-Property statt eines festen Werts**
Ein hartkodierter `padding-top: 48px` (das CSS-`min-height` des Banners) reichte nicht: bei 1280 px
Viewport-Breite wächst der Banner durch `flex-wrap` auf 61 px. Der feste Wert hätte eine
~1,5-px-Überdeckung des Suchfelds übriggelassen — genug, um den natürlichen Klick weiter zu brechen.
`showMigrationHintBanner()` misst jetzt `banner.offsetHeight` nach dem DOM-Einfügen und setzt
`--migration-hint-height`; CSS nutzt `var(--migration-hint-height, 48px)` mit dem alten Wert als
Fallback für Nicht-JS-Kontexte.
*Source: 08-01-SUMMARY.md*

**`build`-Job hängt von `e2e` ab, nicht erst `smoke-test`**
D-03 verlangte ein „blockierendes" E2E-Gate. Statt nur den Deploy zu blockieren, wurde `e2e` in
`needs` des `build`-Jobs aufgenommen — ein roter E2E-Lauf verhindert damit bereits den
Production-Build, nicht erst den nachgelagerten Schritt. Das ist die engste Auslegung von
„blockierend", die sich innerhalb von `ci.yml` allein ausdrücken lässt; das Erzwingen vor dem Merge
bleibt eine GitHub-Branch-Protection-Einstellung ausserhalb der Datei und ist per YAML-Kommentar
markiert.
*Source: 08-04-SUMMARY.md*

**Nur deterministisch ableitbare Assertions gehärtet, der Rest begründet gelockert**
Von 23 inventarisierten `toBeGreaterThan(0)`-Stellen wurden sechs auf exakte `toBe(N)` gehoben —
genau die, deren Wert aus bekannten Setup-Daten folgt (Formel, Vergleichslogik, XP-Fixture,
IDB-Record-Count). Die übrigen 17 hängen an SRD-Datensatzgrößen, Fuzzy-Suche, Zufallstexten,
`Math.random()`-HP-Variation oder echten Timestamps und tragen jetzt einen
Inline-Begründungskommentar statt einer falschen Präzision.
*Source: 08-03-SUMMARY.md*

**Zwei dokumentierte `page.evaluate()`-Ausnahmen bewusst beibehalten**
`nextTurn` in `initiative.spec.js` und `switchView` in `welt-story.spec.js` wurden einzeln gegen das
D-06-Kriterium geprüft und als Navigations-/Setup-Vehikel eingestuft (Pointer-Interception durch
Statblock-Drawer bzw. Fullscreen-Modal) — sie ersetzen nicht die eigentlich getestete Interaktion.
Beibehalten mit ausführlicher Inline-Begründung.
*Source: 08-03-SUMMARY.md*

**Divergenz-Banner-Offset nicht angefasst**
`.migration-hint-banner ~ .divergence-banner { top: 48px }` blieb unverändert — ausserhalb des
Task-Scopes, gefordert war nur die Überdeckung von `#global-search`/Header.
*Source: 08-01-SUMMARY.md*

## Lessons

**Ein `isVisible()`-Guard um die gesamte Assertion-Menge ist ein permanenter stiller Pass**
15 Tests hatten ihre komplette Assertion-Menge in einem einzigen `isVisible()`-Guard. Fehlte das
Element, liefen sie jahrelang leer durch und meldeten Erfolg. Die Konvertierung zu harten
Assertions deckte zwei echte Defekte auf, die der Guard maskiert hatte.
*Source: 08-03-SUMMARY.md*

**Ein maskierter Fehler verdeckt oft einen zweiten dahinter**
`quests.spec.js` erwartete im Toast das deutsche Wort „Titel". Die reale Meldung baut sich aus dem
Schema-Feldnamen (`title: Pflichtfeld fehlt`). Der Mismatch existierte lange, war aber unsichtbar,
weil der Test ohnehin am falschen Toast-Inhalt scheiterte. Erst nach dem Race-Fix trat der zweite,
spezifischere Fehler zutage.
*Source: 08-02-SUMMARY.md*

**Zwei unabhängige Ursachen können dasselbe Symptom erzeugen**
Nach dem Onboarding-Toast-Fix blieb ein Test flakig. Stack-Trace-Instrumentierung fand eine
**zweite**, davon unabhängige Boot-Zeit-Race: `initRandomTables()` ruft bei fehlendem
`D.randomTables` ungefragt `save()` auf (~150 ms nach Boot), und `validateDataIntegrity()` plant eine
Reparatur-`save()` 1 s nach `load()`, wenn `D.timers`/`D.shops`/`D.campaign` oder ein `_nextId`-Eintrag
fehlt — keines davon ist Default-Feld in `core/data.js`. Beide lösen denselben Backup-Hinweis-Toast
aus, der den geteilten `#toast`-Node überschreibt. Das betrifft **jede frische Sitzung**, nicht nur
Tests.
*Source: 08-02-SUMMARY.md*

**Ein `isVisible()`-Guard kann fehlendes UI-Verhalten verdecken, nicht nur ein optionales Element**
Die Annahme, `edit-quest`/`delete-quest` seien wie bei Party/NPCs immer sichtbares Detail-Markup,
war falsch: `.quest-details` ist per CSS bis zum Klick auf `.quest-header` eingeklappt. Der Guard
hatte das fehlende Aufklappen als Pass durchgehen lassen. Der richtige Fix war ein echter Klick, kein
weicherer Selektor.
*Source: 08-03-SUMMARY.md*

**Ein Verify-Skript kann an seinem eigenen Kommentartext scheitern**
Der neue YAML-Kommentar erklärte in Prosa, dass der Job bewusst *ohne* `continue-on-error` läuft — und
enthielt dabei genau den Literal-String, den das Verify-Skript als Abwesenheitsprüfung grep't. Prosa,
die verbotene Strings benennt, kollidiert mit String-basierten Gates.
*Source: 08-04-SUMMARY.md*

**Ein Test-Selektor kann von Anfang an nie gematcht haben**
Der D20-Würfel-Selektor in `app.spec.js` traf nie die reale Produktions-Markup — der Test lief seit
seiner Erstellung im permanenten Leerlauf. Ein grüner Test ist kein Beleg dafür, dass er je etwas
geprüft hat.
*Source: 08-03-SUMMARY.md*

## Patterns

**Geometrischer Overlap-Beweis statt Klick-Erfolg**
Ob ein fixiertes Element ein anderes überdeckt, wird über `boundingBox()` bewiesen
(`searchBox.y >= bannerBox.y + bannerBox.height`) und erst danach mit einem natürlichen Klick ohne
`{force:true}` bestätigt. Der Klick allein wäre ein schwächerer Beleg — er kann auch aus anderen
Gründen gelingen oder scheitern.
*Verwenden bei: Layout-/Overlay-Regressionen. Source: 08-01-SUMMARY.md*

**Vollständiges `D`-Seeding vor `loadApp()` statt punktueller Flags**
Nicht nur das auslösende Flag setzen, sondern alle Felder befüllen, deren Fehlen einen Boot-Zeit-
`save()` auslöst: `randomTables`, `timers`, `shops`, `campaign` plus vollständiges `_nextId` für alle
elf von `validateAndRepairNextId()` geprüften Entity-Typen.
*Verwenden bei: jedem E2E-Test, der Toast-Inhalte assertet. Source: 08-02-SUMMARY.md*

**`setTimeout`-Interception mit exaktem Delay-Wert zur Aufrufer-Suche**
Um den Verursacher eines später feuernden Timers zu finden, `window.setTimeout` temporär abfangen und
auf den bekannten Delay filtern (hier 300 ms = Save-Debounce). Lieferte den entscheidenden Stack:
`init()` → `renderRandomTables()` → `initRandomTables()` → `save()`. Nötig, weil `save()` eine
lexikalisch gebundene `const` ist und ein `window.save`-Wrapper bare Aufrufe strukturell nicht
abfängt. Diagnose-Skripte danach entfernen, nicht committen.
*Verwenden bei: Race-Conditions mit unbekanntem Auslöser. Source: 08-02-SUMMARY.md*

**Warten auf die Bedingung statt auf eine Frist**
Fixe `waitForTimeout(200-500)`, die an einer gefixten Race hingen, durch `waitForSelector`/
`waitForFunction` auf die konkrete Bedingung ersetzen (z. B. `#toast.error` statt festem Sleep).
Bewusst nur dort, wo die Race verstanden war — die übrigen ~16 Spec-Dateien blieben unberührt.
*Verwenden bei: Tests, deren Wartezeit an einer verstandenen Ursache hängt. Source: 08-03-SUMMARY.md*

## Surprises

**Drei der elf „Test-Fails" waren echte App-Bugs**
Die Baseline galt als Test-Schuld. Tatsächlich waren drei Fails Produktionsfehler: eine
Action-Registry-Kollision (eine falsche 2-Parameter-Duplikat-Registrierung in `combat-actions.js`
überschrieb per Last-Write-Wins die korrekten Handler aus `entity-actions.js`, wodurch die
Attribut-Modifikator-Badges nicht live aktualisierten), eine `renderAll()`-Dispatch-Lücke
(`renderRandomTables`/`renderTimers` fehlten, Panels blieben nach Undo veraltet) und das
Banner-Overlay.
*Impact: Die Phase lieferte echte Bugfixes, nicht nur Testpflege. Source: 08-01-SUMMARY.md*

**Ein Verdacht aus der Alt-Triage war empirisch falsch**
Der „9x DOM duplication"-Verdacht aus Cluster 3 (Mai 2026) ließ sich widerlegen: die Zahl war
Playwrights eigener Retry-Poll-Zähler, der Live-DOM-Count war immer 1. Die reale Ursache war eine
ambige `.dice-details`-Selektion, die stets den ersten von vier gleichnamigen `<details>`-Blöcken
traf.
*Impact: Eine über Monate geführte Fehldiagnose wurde korrigiert und im Triage-Dokument als widerlegt
markiert. Source: 08-04-SUMMARY.md*

**Der Boot-Zeit-`save()` betrifft jede echte Sitzung, nicht nur Tests**
Was als Test-Race auffiel, ist ein Produktionsverhalten: bei jedem frischen Boot ohne die vier
Nicht-Default-Felder feuern zwei ungefragte `save()`-Aufrufe und der Backup-Hinweis-Toast.
*Impact: Als Testproblem entdeckt, als App-Verhalten dokumentiert. Source: 08-02-SUMMARY.md*

**Die Root-Cause-Suche brauchte mehrere Instrumentierungs-Iterationen**
DOM-Polling und MutationObserver führten nicht zum Ziel; erst die `setTimeout`-Interception mit
gefiltertem Delay lieferte den Stack. Grund war die `const`-Bindung von `save()`, die den
naheliegenden Wrapper-Ansatz strukturell ausschließt.
*Impact: Deutlich mehr Aufwand als geplant für einen Fix, der am Ende reines Test-Setup war.
Source: 08-02-SUMMARY.md*
