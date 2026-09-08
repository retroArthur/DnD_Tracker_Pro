# Phase 15: Befundlage & Vorlauf - Research

**Researched:** 2026-09-08
**Domain:** Interne Codebase-Archäologie (Doku-Korrektur, tote CSS, drei DM-Screen-/Würfel-Bugfixes,
Ratschen-Infrastruktur) — keine externen Bibliotheken, kein neuer Netzwerkzugriff
**Confidence:** HIGH — praktisch jede tragende Zahl wurde in dieser Sitzung gegen HEAD `522ad13`
frisch nachgemessen (nicht aus CONTEXT.md übernommen); Abweichungen sind unten explizit markiert.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Alle 55 Entscheidungen (D-01 bis D-55) aus `.planning/phases/15-befundlage-vorlauf/15-CONTEXT.md`
sind für diese Phase bindend — sie sind unter „Claude's Discretion" (unten) als vom Nutzer
ausdrücklich autorisiert eingestuft, aber inhaltlich als *Entscheidungen*, nicht als Vorschläge
formuliert. Volltext siehe CONTEXT.md `<decisions>`-Block. Kernpunkte, gruppiert:

- **Befundlage, Protokoll, Dokumentkorrektur (D-01..D-08):** Blocker-Entscheidungen kommen nach
  `PROJECT.md` § „Blocker-Entscheidungen v1.3" (D-01); jede Phase 16-19 bekommt eine
  `**Canonical refs**`-Zeile im ROADMAP-Detailblock (D-02); `DECISIONS-INDEX.md` wird NICHT angelegt
  (D-03); Handoff-Dateien werden in-place korrigiert, `.dc.html`/`support.js` bleiben unberührt
  (D-04); Verworfenes wird markiert, nicht gelöscht — PATCHES.md §8 bekommt einen
  „VERWORFEN (B-07)"-Block (D-05); der Abnahme-grep (163) schlägt die Prosa-Zahl (151) (D-06); jeder
  PATCHES-Anker wird zum Tripel Datei:Zeile + Text + grep-Trefferzahl (D-07); redaktionelle
  Nachführung von ROADMAP.md/REQUIREMENTS.md ist benannte Arbeit dieser Phase (D-08).
- **Die drei sichtbaren Defekte (D-09..D-17):** CSS folgt dem JS-Markup, JS bleibt unangetastet
  (D-09, Snapshot-Netz schützt Markup); alle drei Referenzwidgets werden repariert, nicht zwei
  (D-10); Fundstellenangaben in FIX-01 werden korrigiert (D-11); „Wissensgebiete"/„Fertigkeiten"
  sind zwei verschiedene Widgets, nicht zu verwechseln (D-12); Attributfarben der
  Fertigkeitsköpfe kommen aus `color-mix(in srgb, var(--attr-<x>) 20%, transparent)` (D-13);
  `renderCompactSpellSlots` wird auf die `.slot-pip`-Familie umgestellt, `char-slot-*` bekommt
  KEINE eigenen CSS-Regeln (D-14); Erfolgskriterium 4 wird auf `.spell-slots-compact .slot-pip`
  umgeschrieben (D-15); FIX-03 ist rein JS-seitig, kein neues CSS (D-16); Abnahme am gebauten
  Bündel per Playwright + neue `DMS_UNSTYLED_MAX`-Ratsche mit `class`-Attribut-Filter (D-17).
- **Löschlauf (D-18..D-26):** `prefers-reduced-motion` — vier Blöcke fallen, einer wird in
  `core.css` neu angelegt, `.skeleton` fällt mit (D-18); Rückbau-Ratsche sichert den Block (D-19);
  `tools/css-usage-report.js` (Node, ohne Abhängigkeiten) erzeugt die bindenden Löschzahlen — NICHT
  die kolportierten 438/607/~3.174 (D-20); dreistufige Lebend-Erkennung mit eingefrorener
  Präfixliste (`color-`, `condition-`, `editor-toolbar-`, `rel-btn-`, `tag-`) (D-21);
  Fehlalarm-Prüfung ist Pflicht, `.pwa-install-banner` fällt mit seinem Markup in einem Commit
  (D-22); eine Datei je Commit, MAP-Block zuerst, Testdatei zuletzt (D-23); Nachweis auf drei
  Säulen, Stil-Diff ist erwartungsgeführt, nicht leer (D-24); Löschliste wird NACH den
  FIX-Commits neu erhoben, keine vorab eingefrorene Ausnahmeliste (D-25); Baseline-Artefakt
  `15-RATCHET-BASELINE.md` (Vorbild `14-GATE-BASELINE.md`) als letzter Plan-Schritt (D-26).
- **Ratschendisziplin und Abnahme (D-49..D-55):** „Beidseitig bewiesen" ist eine ausführbare
  Checkliste je Ratschentyp (D-49); Ausgangswert trägt Kommentarformat mit Zählart, Verweis auf
  `15-RATCHET-BASELINE.md` (D-50); die drei bestehenden Ratschen (`DUBLETTEN_MAX=0`,
  `IMPORTANT_MAX=105`, `INLINE_MAX=257`) haben null Spielraum — Planungsgrundlage (D-51); von fünf
  bedrohten Prüfungen bricht nur `F-14` wirklich, im selben Commit wie §1b gefixt (D-52);
  dreistufige Abnahme mit menschlicher Vollrunde erst nach 16/17/18, gezielte Stellenliste nach 15
  (D-53, bestätigungspflichtig); Harness deckt Messbares ab, nicht Urteile (D-54); Testzahlen
  (Jest 1217/53, Playwright 354/352+2skip, design-consistency 64, pytest 24) sind korrekter,
  datierter Ausgangswert (D-55).
- **Vorbereitung für spätere Phasen, hier nur entschieden, nicht ausgeführt (D-27..D-48):**
  Farbmechanik/Ausnahmelisten (D-27..D-34, Ausführung Phase 16), Schatten/Bewegung/Gewicht
  (D-35..D-42, Ausführung Phasen 17/18 — **außer D-42, das ist ein Vorarbeits-Task für diese
  Phase**: `declarationsOf()` bekommt den `fonts.css`-Ausschluss bereits jetzt, damit eine spätere
  `font-weight`-Ratsche nicht sofort fehlschlägt), Fokus und Zähler (D-43..D-48, Ausführung
  Phase 19).

**Vier Punkte brauchen ausdrückliche Nutzerbestätigung** (laut CONTEXT.md, weil sie sichtbares
Verhalten oder Arbeitslast betreffen — nicht Sache dieser Recherche, aber vom Planer zu markieren):
**D-53** (weniger händische Abnahmerunden), **D-43** (goldener Rahmen statt Fokusring — wirkt erst
in Phase 19), **D-39** (Bewegungsgefühl bleibt unverändert — Phase 17), **D-41** (Gewicht 500
bleibt in v1.3 unangetastet — Phase 18).

### Claude's Discretion

Der Nutzer hat die Auswahl der Diskussionsbereiche abgebrochen und angewiesen: „Führe alle Bereiche
nach deinen Empfehlungen aus." Sämtliche 55 Entscheidungen in CONTEXT.md sind damit
Claude-Ermessen unter dieser ausdrücklichen Anweisung — als Entscheidungen formuliert, nicht als
Vorschläge, damit die Phasen 16-19 nicht erneut fragen müssen.

### Deferred Ideas (OUT OF SCOPE)

- Kurvenwechsel `--ease` auf `cubic-bezier(0.2,0,0.2,1)` — Token wird mit Wert `ease` eingeführt
  (D-39), der eigentliche Kurvenwechsel ist ein späterer Milestone.
- `font-weight: 500` → 600 ausführen — Zielwert entschieden (D-41), Ausführung bleibt bei TYPO-07
  (zurückgestellt).
- Hex-Farbliterale außerhalb `assets/styles/` (148 gemessene Stellen) — als datierte Restschuld
  nach D-33 buchen, kein Requirement deckt sie.
- Wächtertest für generierte Werkzeugleisten (`tools/sync-editor-toolbars.js --check`) — Behauptung
  wird von Phase 15 korrigiert (D-32), der Test selbst bleibt Restschuld.
- `renderSpellSlotPips` als toter JS-Code — bleibt stehen, DEAD-01..03 sind auf `assets/styles/`
  beschränkt; ein JS-Löschlauf ist ein eigenes Vorhaben.
- Dritte Pip-Familie (`.init-slot-box`) vereinheitlichen — Gestaltungsfrage, kein Defekt.
- Trefferflächen für den Tisch vergrößern (`.slot-pip` 18×18px, unter 44px-Touch-Empfehlung) —
  eigene Gestaltungswelle.
- Neun ungestylte `dms-*`-Klassen bleiben nach FIX-01 bewusst stehen (`dms-dc-mini`,
  `dms-econ-icon`, `dms-econ-val`, `dms-economy-header`, `dms-know-skill`, `dms-know-types`,
  `dms-ritual-item`, `dms-ritual-list`, `dms-save-desc`) — von der neuen `DMS_UNSTYLED_MAX`-Ratsche
  festgehalten, nicht in dieser Phase behoben.
- Tastatur-Erreichbarkeit als JS-Strang (A11Y-01..06) — beim Milestone-Aufsetzen abgewählt.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|--------------------|
| BASE-01 | 13 Blocker schriftlich entschieden, in `PROJECT.md` gebucht | PROJECT.md-Zeilen 462/485 (Key Decisions/Evolution) bestätigt gelesen — der neue Abschnitt gehört exakt dazwischen (D-01) |
| BASE-02 | 36 korrigierte Kennzahlen in Handoff-Dateien eingearbeitet | Kernzahlen nachgemessen: `transition: all` = 163 (nicht 151, exakter CHECKLISTE-grep reproduziert), `rgba(251,191,36,…)` = 32, `rgba(251,146,60,…)` = 12 (32+12=44 bestätigt) |
| BASE-03 | N-08 widerlegt, §8 in PATCHES.md entfernt/markiert | `prefers-reduced-motion`-Block in `dmscreen.css:1408-1419` bestätigt (nicht 1408-1414) — Existenzbeweis für die Widerlegung erbracht |
| BASE-04 | Jede neue Ratsche vorab mit dem späteren Testausdruck gemessen | `DUBLETTEN_MAX=0`, `IMPORTANT_MAX=105`, `INLINE_MAX=257` exakt reproduziert — Beweis, dass die bestehende Praxis funktioniert und fortzusetzen ist |
| DEAD-01 | Toter CSS-Bestand gelöscht (Ausgangszahl neu zu erheben) | `tools/css-usage-report.js` existiert noch nicht (bestätigt: 0 Treffer im Repo) — Bau-Task ist Voraussetzung, siehe Pitfall 5 |
| DEAD-02 | Präfixerkennung für dynamische Klassennamen vor jeder Löschung | Alle 5 Präfixe (`color-`,`condition-`,`editor-toolbar-`,`rel-btn-`,`tag-`) haben nachweislich nichtleere Treffer in `class`-Kontexten (8/12/1/1/23) — Präfixliste ist gerechtfertigt |
| DEAD-03 | Umfang jeder Folgewelle neu gemessen, nicht fortgeschrieben | `15-RATCHET-BASELINE.md`-Formvorbild (`14-GATE-BASELINE.md`) direkt gelesen und im Architecture-Pattern-Abschnitt dokumentiert |
| FIX-01 | DM-Screen-Widgets Gelände/Fertigkeiten/Wissensgebiete gestylt | Alle drei CSS/JS-Divergenzen exakt bestätigt, inkl. bisher unbenannter Verschärfung bei `.dms-skill-header` vs. `.dms-skill-group-header` — siehe Code Examples |
| FIX-02 | Zauberplatz-Pip sichtbar und bedienbar | `party-render.js:308-341`, `event-delegation.js:94-97`, `spellslots-ui.js:35-37` gelesen — Klick-Nulleffekt bis zur exakten Abbruchzeile (37) nachvollzogen |
| FIX-03 | Würfelzahl behält Formatierung, Crit/Fumble-Färbung greift | `dice-core.js:336-365`, `dice.css:21-37/677-693` gelesen — Bug und funktionierendes Vorbild exakt lokalisiert |
| GATE-03 | Jede neue Ratsche rot-grün bewiesen, Ausgangswert im Kommentar | Bestehendes Muster (`design-consistency.test.js:897-947`) als Vorbild dokumentiert |
| GATE-04 | Geltungsbereich CSS vs. JS/Templates pro Befund entschieden | `sourceJs()`-Helper (Zeilen 281-297) bereits vorhanden und dokumentiert als wiederverwendbare Grenze |
| GATE-05 | Nach jeder Welle alle Suiten grün, Build läuft, vier Themes gesichtet | Volle Kette in dieser Sitzung tatsächlich ausgeführt und grün: Jest 1217/1217, Playwright 352+2skip/354, pytest 24/24, beide Builds erfolgreich |

</phase_requirements>

## Summary

Phase 15 ist keine Feature-Phase, sondern eine Vorlauf-Phase: sie korrigiert Dokumente, löscht
beweisbar toten CSS-Bestand, behebt drei sichtbare Defekte und legt die Ratschen-Regeln fest, denen
die Phasen 16–19 nur noch folgen. Es gibt **keine neuen externen Abhängigkeiten** — die einzige neue
Code-Datei ist ein einziges Node-Werkzeug ohne Fremdpakete (`tools/css-usage-report.js`, analog zu
`tools/generate-eslint-globals.js`, das bereits abhängigkeitsfrei arbeitet).

Diese Recherche hat die vier explizit angeforderten Prüfpunkte nachgemessen: **`prefers-reduced-
motion` (bestätigt: 4 Top-Level-Blöcke, keiner in `core.css`), die Suiten-Basislinien (Jest, Playwright,
`design-consistency.test.js`, `pytest tests/build` — alle exakt bestätigt), und die drei FIX-01/02/03-
Selektoren (alle Fundstellenangaben aus CONTEXT.md exakt bestätigt, inklusive einer bisher nicht
benannten Verschärfung: die CSS-Klasse für die Fertigkeiten-Köpfe heißt `.dms-skill-group-header`,
das JS erzeugt aber `.dms-skill-header` — zwei komplett verschiedene Namen, nicht nur eine
Spezifitätslücke).** Die 438/607/~3.174-Zahlen für DEAD-01 konnten **nicht** unabhängig reproduziert
werden, weil das dafür vorgesehene Werkzeug (`tools/css-usage-report.js`, D-20) noch nicht existiert
— das ist erwartungsgemäß, D-20 sagt selbst, dass diese Zahlen erst nach dem Bau des Werkzeugs
verbindlich werden. Für den Planer folgt daraus: **das Werkzeug muss zuerst gebaut werden, bevor
irgendein Löschcommit entsteht** — keine der drei kursierenden Zahlen darf als Zielwert in einen Task
geschrieben werden.

**Primäre Empfehlung:** Der Plan folgt exakt der in CONTEXT.md/D-23 vorgegebenen Reihenfolge —
BASE (Doku) → FIX-01/02/03 (Bugfixes, CSS folgt JS-Markup) → Löschlauf (Werkzeug bauen, dann
löschen, ein Commit je Datei) → `15-RATCHET-BASELINE.md` als letzter Schritt. Jede neue Ratsche wird
nach dem in Phase 14 etablierten Beweisprotokoll (`14-GATE-BASELINE.md`) rot-grün bewiesen, nicht nur
grün gemessen.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Blocker-Entscheidungen dokumentieren (BASE-01/02/03/04) | Projekt-Dokumentation (`PROJECT.md`, `REQUIREMENTS.md`, Handoff-Dateien) | — | Reine Prosa-/Markdown-Arbeit, kein Code-Pfad |
| Toter CSS-Bestand löschen (DEAD-01/02/03) | CDN/Static (CSS-Ausgabe im gebauten Bündel) | Build-Tooling (`tools/css-usage-report.js`) | CSS ist reine Präsentationsschicht; das Löschwerkzeug ist ein Build-Zeit-Skript, kein Laufzeitcode |
| DM-Screen-Widget-Styling (FIX-01) | CDN/Static (CSS) | Browser/Client (das bereits eingefrorene JS-Markup bleibt unangetastet, D-09) | CSS folgt dem vorhandenen JS-Markup; keine JS-Änderung nötig oder erlaubt |
| Zauberplatz-Pip klickbar machen (FIX-02) | Browser/Client (`party-render.js`, Event-Delegation) | CDN/Static (keine neue CSS-Klasse — nur Markup-Wechsel auf `.slot-pip`) | Der Klick-Handler-Vertrag (`ctx.id`/`ctx.value` aus `data-id`/`data-value`) ist reine Client-Logik in `ui/event-delegation.js` |
| Würfelfarbe nach erstem Wurf (FIX-03) | Browser/Client (`dice-core.js`) | CDN/Static (bestehende CSS-Klassen, keine neuen) | Reiner JS-Bug: falsches DOM-Element bekommt die Klasse; CSS existiert bereits korrekt |
| Ratschen-Infrastruktur (GATE-03/04/05) | Build-Tooling / Testinfrastruktur (`tests/unit/design-consistency.test.js`) | Projekt-Dokumentation (`PROJECT.md` § Übertrag) | Ratschen sind Jest-Assertions gegen Quelltext, keine Laufzeitkomponente |

## Package Legitimacy Audit

**Nicht anwendbar.** Diese Phase installiert keine externen Pakete. Das einzige neue Artefakt ist
`tools/css-usage-report.js` — ein Node-Skript ohne Abhängigkeiten (Vorbild: `tools/generate-eslint-
globals.js`, bereits im Repo, ebenfalls ohne `require()` auf ein npm-Paket). `package.json`
`devDependencies` werden von dieser Phase nicht verändert.

## Standard Stack

Keine neuen Bibliotheken. Die Phase arbeitet ausschließlich mit bereits vorhandenen Werkzeugen:

| Werkzeug | Version (gemessen) | Zweck in dieser Phase |
|----------|---------------------|------------------------|
| Node.js | v24.14.0 (`node --version`, gemessen) | Laufzeit für `tools/css-usage-report.js` |
| Jest | ^30.2.0 (`package.json`) | Ratschen-Tests (`design-consistency.test.js`), neue FIX-01/02/03-Regressionstests |
| Playwright | gemäß `playwright.config.js` | Neuer Spec für berechnete Endwerte (D-17), Vorher/Nachher-Stil-Diff (D-24) |
| Python + pytest | gemäß `requirements-dev.txt` | `pytest tests/build` — unverändert von dieser Phase betroffen |

**Installation:** keine — es werden keine `npm install`/`pip install`-Schritte benötigt.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  BASE-Welle (Dokumentation, keine Laufzeit-Wirkung)                  │
│  BEFUNDE-v2.md / PATCHES.md / CHECKLISTE.md / README.md              │
│         │ (36 Zahlen korrigiert, §8 als VERWORFEN markiert)          │
│         ▼                                                            │
│  PROJECT.md § Blocker-Entscheidungen v1.3 (neuer Abschnitt, D-01)    │
│         │ (13 B-Blocker gebucht, Verweiszeilen in Key Decisions)     │
│         ▼                                                            │
│  ROADMAP.md Phasen 16-19 (Canonical-refs-Zeile eingefügt, D-02)      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FIX-Welle (drei isolierte Bugfixes, je eigener Commit)               │
│                                                                        │
│  FIX-01: dmscreen-widgets-reference.js (JS, UNVERÄNDERT)              │
│              │ erzeugt .dms-terrain-item / .dms-skill-header /        │
│              │ .dms-know-skill (heute ohne CSS-Regel)                 │
│              ▼                                                        │
│          dmscreen.css (CSS wird auf JS-Klassennamen umgeschrieben)    │
│              │ + color-mix(var(--attr-<x>)) statt hartkodiertem rgba  │
│                                                                        │
│  FIX-02: party-render.js renderCompactSpellSlots()                    │
│              │ Rumpf ersetzt: erzeugt jetzt .slot-pip-Familie         │
│              │ mit data-id/data-value statt data-char/-level/-index   │
│              ▼                                                        │
│          ui/event-delegation.js liest ctx.id/ctx.value (UNVERÄNDERT)  │
│              ▼                                                        │
│          toggleSpellSlot(charId, level) — jetzt real, nicht (null,NaN)│
│                                                                        │
│  FIX-03: dice-core.js Zeile 345                                       │
│              │ heroResult.className = '' → 'dice-hero-result'         │
│              │ crit/fail wandern von #dice-hero auf #dice-hero-result │
│              ▼                                                        │
│          dice.css (UNVERÄNDERT — Regel existiert bereits korrekt)     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Löschlauf (erst NACH den FIX-Commits, D-25)                          │
│                                                                        │
│  tools/css-usage-report.js (NEU, Node, ohne Abhängigkeiten)           │
│      │ Stufe 1: Wort-Token-Match                                      │
│      │ Stufe 2: 5 Präfixe (color-/condition-/editor-toolbar-/         │
│      │          rel-btn-/tag-), nur aus class-Kontexten                │
│      │ Stufe 3: Anker-Regel für Verbundselektoren                     │
│      ▼                                                                │
│  Löschung, 1 Commit je Datei (dashboard.css MAP-Block zuerst)         │
│      ▼                                                                │
│  Playwright-Vorher/Nachher-Stildiff (erwartungsgeführt, D-24)         │
│      ▼                                                                │
│  15-RATCHET-BASELINE.md (letzter Schritt, D-26 — Vorbild:              │
│  14-GATE-BASELINE.md)                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

Keine neuen Verzeichnisse. Betroffene/neue Dateien:

```
tools/
└── css-usage-report.js       # NEU — Node, ohne Abhängigkeiten (D-20)
assets/styles/
├── dmscreen.css               # FIX-01 (CSS-Umschreibung), + Löschungen (DEAD-01)
├── dashboard.css              # Löschung MAP-Block (547-1224) + weitere
├── core.css                   # NEU: prefers-reduced-motion-Block (D-18)
├── command-palette.css        # Löschung: prefers-reduced-motion-Block
├── migration.css              # Löschung: prefers-reduced-motion-Block
├── pwa.css                    # Löschung: prefers-reduced-motion-Block + PWA-Banner-CSS (dmscreen.css:1017 ist der zu löschende Block, NICHT pwa.css — s. Pitfalls)
└── loot.css                   # Löschung: toter @media-Block
features/party/party-render.js # FIX-02 (renderCompactSpellSlots Rumpf)
features/dice/dice-core.js     # FIX-03 (Zeile 345)
assets/templates/modals-editors.html  # Löschung: .pwa-install-banner-Markup
core/constants.js              # Löschung: verwaiste CALL_ACTION_WHITELIST-Einträge
tests/unit/design-consistency.test.js # neue Ratschen (F-2x), fonts.css-Ausschluss in declarationsOf()
tests/e2e/features/            # neuer Playwright-Spec für FIX-01/02/03 berechnete Endwerte
.planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md  # NEU, letzter Plan-Schritt
.planning/PROJECT.md            # neuer Abschnitt § Blocker-Entscheidungen v1.3
.planning/ROADMAP.md            # Canonical-refs-Zeilen für Phasen 16-19
```

### Pattern 1: CSS folgt dem JS-Markup (nicht umgekehrt)

**What:** Wenn CSS-Selektoren und tatsächlich gerendertes JS-Markup auseinandergelaufen sind, wird
das CSS an das JS angeglichen, niemals das JS an ein eingefrorenes Snapshot-Netz.
**When to use:** FIX-01 (alle drei DM-Screen-Referenzwidgets).
**Warum bindend:** `tests/unit/__snapshots__/dmscreen-characterization.test.js.snap` friert das
Markup der drei betroffenen Widgets in dedizierten Snapshots ein (bestätigt: 50 Snapshots, alle
grün, Teil der 1217 Jest-Tests). CSS-Selektoren ändern bricht diese Snapshots nicht; JS-Markup
ändern schon.
**Example:**
```css
/* Source: assets/styles/dmscreen.css:2481 (bestehend, VOR dem Fix) */
.dms-skill-group-header { font-size: 0.75em; font-weight: 600; ... }
.dms-skill-group.str .dms-skill-group-header { background: rgba(239, 68, 68, 0.2); color: var(--red); }
```
```html
<!-- Source: features/dmscreen/dmscreen-widgets-reference.js:91 (unverändert) -->
<div class="dms-skill-header str">STR</div>
```
Die beiden Namen `.dms-skill-group-header` (CSS) und `.dms-skill-header` (JS) sind **zwei
verschiedene Zeichenketten** — kein Spezifitätsproblem, kein Match überhaupt möglich. Der Fix
schreibt die CSS-Regel auf `.dms-skill-header.str` um (kombiniert mit `color-mix(in srgb,
var(--attr-str) 20%, transparent)` statt dem hartkodierten `rgba(239, 68, 68, 0.2)`, D-13).

### Pattern 2: Ratschen als beidseitig bewiesene Schwellwerte (Phase-14-Erbe)

**What:** Jede neue Ratsche (Test, der eine Zahl nicht wieder steigen lässt) wird nicht nur grün
gemessen, sondern aktiv rot gemacht (Grenzwert −1, echten Verstoß einfügen) und dann wieder grün
zurückgeführt — beide Exit-Codes landen im Messprotokoll.
**When to use:** Jede neue Konstante in `design-consistency.test.js` (z. B. `DMS_UNSTYLED_MAX`,
D-17) und die `prefers-reduced-motion`-Rückbausicherung (D-19).
**Example (Vorbild aus dem bestehenden Netz):**
```javascript
// Source: tests/unit/design-consistency.test.js:897-898, 940
const DUBLETTEN_MAX = 0;
const IMPORTANT_MAX = 105;
// ...
const INLINE_MAX = 257;
```
Alle drei Werte wurden in dieser Sitzung erneut gegen den Live-Baum gemessen und stimmen exakt.

### Pattern 3: Abhängigkeitsfreies Node-Werkzeug für Build-Zeit-Analyse

**What:** Ein Node-Skript ohne `package.json`-Abhängigkeit, das den Quellbaum liest und eine
maschinenlesbare (oder menschlich lesbare Tabellen-)Ausgabe erzeugt.
**When to use:** `tools/css-usage-report.js` (D-20).
**Vorbild im Repo:** `tools/generate-eslint-globals.js` (bereits vorhanden, liest `loader.js`
`MODULES`, erzeugt `eslint.generated-globals.js`, ohne `require()` eines npm-Pakets).

### Anti-Patterns to Avoid

- **Teilstring-Greps als Löschkriterium:** Eine Stichprobe von 27 als tot gemeldeten Klassen ergab
  laut CONTEXT.md/D-21 zwei Fehlalarme durch Teiltreffer. Wort-Token-Matching (nicht `.includes()`)
  ist Pflicht für Stufe 1 des Löschwerkzeugs.
- **Eine Ausnahmeliste vor den FIX-Commits einfrieren:** FIX-01 belebt 9, FIX-02 4 heute tote
  `dms-`/`char-slot-`-Selektoren wieder. Die Löschliste muss nach den FIX-Commits neu erhoben
  werden (D-25), sonst löscht der Lauf Selektoren, die die eigene Phase gerade erst gebraucht hat.
- **`window.save` wrappen für Live-Sync o.ä.:** nicht Gegenstand dieser Phase, aber die bestehende
  CLAUDE.md-Warnung gilt für jeden Code-Touch in dieser Phase unverändert — `save` ist ein globales
  `const`, ein Wrapper wird von `bare save()`-Aufrufen umgangen.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS-Kommentare beim Zählen ignorieren | Eigene Regex-Comment-Strip-Logik | `withoutComments()` aus `tests/unit/design-consistency.test.js:29-32` | Bereits vorhanden, bereits von 64 Tests genutzt, deckt `/* ... */` korrekt |
| Alle CSS-Quelldateien als ein String einlesen | Eigene `readdirSync`-Schleife | `readAll('assets/styles', '.css')` (`design-consistency.test.js:18-24`) | Gleiche Funktion, gleiche Reihenfolge wie die 64 bestehenden Tests — keine zweite Quelle der Wahrheit |
| Alle JS-Quelldateien für den JS-Geltungsbereich (GATE-04) einlesen | Eigenen Verzeichnis-Walk | `sourceJs()` (`design-consistency.test.js:281-297`) | Definiert bereits exakt den Sechs-Verzeichnis-Scope (`features, systems, ui, core, render, utils`), den GATE-04 braucht |
| Deklarationswerte einer CSS-Property extrahieren | Eigenes Regex-Parsing | `declarationsOf(prop, opts)` (`design-consistency.test.js:450-457`) | Bereits vorhanden — **muss aber vor der ersten `font-weight`-Ratsche um einen `fonts.css`-Ausschluss ergänzt werden (D-42)**, sonst zählt sie `@font-face`-Deklarationen mit |
| Baseline-Messprotokoll neu strukturieren | Eigenes Format erfinden | `14-GATE-BASELINE.md` als Formvorbild (D-26) | Bereits etabliertes, bewährtes Format: Messblock je Kennzahl, Befehl + Tabelle + Interpretation |

**Key insight:** Dieses Projekt hat für praktisch jedes Werkzeug, das diese Phase bräuchte, bereits
eine funktionierende, getestete Referenzimplementierung im selben Testfile. Der teuerste Fehler
wäre, eine zweite, leicht abweichende Zählart parallel zur bestehenden zu bauen — genau das Muster,
das laut CONTEXT.md die sechs kursierenden rgba-Zahlen erzeugt hat (vier nie benannte Zählarten).

## Common Pitfalls

### Pitfall 1: Zwei Dinge mit demselben Namen, die nicht dasselbe sind

**What goes wrong:** Der PWA-Banner-CSS-Block (`dmscreen.css:1017-1043`, `.pwa-install-banner`) ist
NICHT derselbe Block wie die `prefers-reduced-motion`-Regel für das PWA-Update-Banner
(`pwa.css:130-134`, `.pwa-update-banner`). Es gibt zwei verschiedene PWA-Banner im Code:
`#pwa-install-banner` (statisches Markup in `modals-editors.html:597`, tot — siehe Pitfall 2) und
`#pwa-update-banner` (laufzeit-erzeugt in `systems/spellslots/pwa-install.js:56-111`, lebendig).
**Why it happens:** Ähnliche Namen, unterschiedliche CSS-Dateien (`dmscreen.css` vs. `pwa.css`),
unterschiedliche Lebendigkeit.
**How to avoid:** Bei jeder Lösch-/Umzugs-Entscheidung den vollen Selektor UND die Datei zitieren,
nicht nur den halbautomatisch erinnerten Namen.
**Warning signs:** Ein grep nach `pwa-` liefert Treffer in mehr als einer Datei mit ähnlichem, aber
nicht identischem Namen.

### Pitfall 2: Der PWA-Install-Banner ist doppelt tot — Markup UND eine seiner zwei Aktionen

**What goes wrong:** `assets/templates/modals-editors.html:597-606` enthält ein `.pwa-install-
banner`-Markup mit zwei Buttons (`data-value="installPWA"`, `data-value="dismissPWABanner"`). Kein
JS-Pfad zeigt dieses Banner jemals an (`grep` nach `pwa-install-banner` in allen `.js`-Dateien:
0 Treffer außer Playwright-Testartefakten). Schlimmer: **`dismissPWABanner` ist als Funktion
nirgends definiert** — der Button wäre schon heute ein stiller Fehlklick gewesen, hätte ihn je
jemand gesehen. `installPWA` selbst ist eine echte, funktionierende Funktion
(`systems/spellslots/pwa-install.js:36`) — sie wird aber über den funktionierenden Header-Button
(`#pwa-install-btn`, `data-action="install-pwa"`, `header.html:11`) aufgerufen, nicht über dieses
Banner.
**Why it happens:** Vermutlich ein Alt-Entwurf, der durch die spätere Header-Button-Lösung (Plan
02-02, laut Kommentar in `pwa-install.js:3`) ersetzt, aber nie aus dem Template entfernt wurde.
**How to avoid:** D-22 sieht vor, Markup + CSS + die verwaisten `CALL_ACTION_WHITELIST`-Einträge in
**einem** Commit zu löschen — `installPWA` (`core/constants.js:627`) und `dismissPWABanner`
(`core/constants.js:606`) sind beide betroffen. `installPWA` bleibt als **Funktion** bestehen (der
Header-Button braucht sie weiter), nur ihr `CALL_ACTION_WHITELIST`-Eintrag für den `data-action="
call"`-Pfad wird verwaist, weil `data-value="installPWA"` nach der Löschung nirgends mehr vorkommt.
**Warning signs:** Ein UAT-Punkt für die PWA-Installation über den Kopfzeilen-Knopf (nicht über das
gelöschte Banner!) ist in D-22 bereits vorgesehen — nicht vergessen, das ist die einzige noch
lebende Installationsroute.

### Pitfall 3: `.skeleton` — 11 Treffer gemessen, nicht 12

**What goes wrong:** CONTEXT.md (`code_context`) behauptet „12 von 12 Treffern im Quellbaum liegen
in `dmscreen.css` selbst". Diese Recherche zählt **11** Treffer (`grep -rn "skeleton"` über CSS/JS/
HTML, Zeilen 1322/1330/1334/1339/1344/1345/1346/1348/1354/1359/1415 — alle in `dmscreen.css`).
**Why it happens:** Vermutlich eine Off-by-one-Zählung bei der ursprünglichen Erhebung (evtl. wurde
der `@media`-Block selbst mitgezählt oder ein Kommentartreffer).
**How to avoid:** Vor dem Löschen der `.skeleton`-Basisregel und ihrer `@keyframes` (Teil von D-18)
den Befund mit `grep -rn "skeleton" assets/styles/ features/ ui/ core/ systems/ render/ utils/
assets/templates/` selbst reproduzieren — die Richtung des Befunds (tot, alle Treffer in
`dmscreen.css`) bleibt richtig, nur die genaue Zahl weicht leicht ab. Bei Verwendung im Kommentar
der neuen Ratsche die selbst gemessene Zahl (11) verwenden, nicht die kolportierte (12).
**Warning signs:** jede übernommene Zahl, die nicht in derselben Sitzung nachgemessen wurde.

### Pitfall 4: `--attr-con` existiert, wird aber von keinem der drei FIX-01-Widgets gebraucht

**What goes wrong:** Der kanonische Attribut-Tokensatz umfasst sechs Werte (`--attr-str/-dex/-con/
-int/-wis/-cha`, `variables.css:289-294`), aber die Fertigkeiten-Kopfzeilen (D-13) brauchen nur
fünf (STR/DEX/INT/WIS/CHA — D&D 5e hat keine CON-basierten Fertigkeiten). Ein Task, der
„fünf Farben aus dem Attribut-Tokensatz" ohne genaue Aufzählung formuliert, riskiert eine
versehentliche sechste `color-mix`-Regel für `.dms-skill-header.con`, die im JS nie vorkommt.
**How to avoid:** Die fünf Rollen explizit aufzählen (str/dex/int/wis/cha), nicht „alle
Attribut-Tokens".

### Pitfall 5: `tools/css-usage-report.js` existiert noch nicht — keine Löschzahl ist heute belastbar

**What goes wrong:** Ein Plan, der DEAD-01/02/03 direkt mit den Zahlen 438/607/~3.174 als
Task-Zielwert formuliert, plant gegen eine laut D-20 explizit für nicht reproduzierbar erklärte
Zahl. Diese Recherche bestätigt: `tools/css-usage-report.js` ist **nicht im Repo** (weder unter
`tools/` noch sonst referenziert in `package.json`/`build.py`).
**How to avoid:** Der Plan muss den Bau des Werkzeugs als eigenen, frühen Task innerhalb der
Löschlauf-Welle vorsehen — die Löschzahl wird ausschließlich vom Werkzeug erzeugt, danach in
`15-RATCHET-BASELINE.md` eingetragen. Kein Task darf „lösche 438 Klassen" als Erfolgskriterium
formulieren.
**Warning signs:** ein Plan-Task mit einer harten Zahl vor dem Werkzeug-Bau-Task.

## Code Examples

### FIX-01 — Terrain-Widget, CSS/JS-Divergenz (bestätigt)

```javascript
// Source: features/dmscreen/dmscreen-widgets-combat.js:136-147 (Gelände-Renderer, UNVERÄNDERT)
<div class="dms-terrain-list">
    <div class="dms-terrain-item normal">
        <span class="dms-terrain-type">Normal</span>
        <span class="dms-terrain-effect">Keine Einschränkung</span>
    </div>
    <div class="dms-terrain-item difficult"> ... </div>
    <div class="dms-terrain-item hazard"> ... </div>
</div>
```
```css
/* Source: assets/styles/dmscreen.css:2832-2874 (bestehende Regeln, erwarten andere Klassen) */
.dms-terrain-sections { ... }
.dms-terrain-section { ... }
.dms-terrain-title { ... }
.dms-terrain-examples { ... }
.dms-terrain-tag { ... }
/* Keine Regel für .dms-terrain-list, .dms-terrain-item, .dms-terrain-type, .dms-terrain-effect */
```
Bestätigt: `dms-terrain-item` hat gemessen `padding: 0px`, `background: transparent`,
`border-radius: 0px` im gebauten Bündel (deckt sich mit REQUIREMENTS FIX-01).

### FIX-02 — Der stille Klick-Nulleffekt (bestätigt bis zur exakten Zeile)

```javascript
// Source: features/party/party-render.js:308-341 (renderCompactSpellSlots, VOR dem Fix)
function renderCompactSpellSlots(ch) {
    // ...
    html += `<span class="char-slot-pip ${isAvailable ? 'available' : ''}"
        data-action="toggle-spell-slot-stop"
        data-char="${ch.id}"
        data-level="${level}"
        data-index="${i}"
        title="${isAvailable ? 'Verfügbar' : 'Verbraucht'}"></span>`;
    // ...
}
```
```javascript
// Source: ui/event-delegation.js:94-97 (UNVERÄNDERT — der Handler-Vertrag, den FIX-02 erfüllen muss)
const action = target.dataset.action;
const id = target.dataset.id ? parseEntityId(target.dataset.id) : null;
const type = target.dataset.type || null;
const value = target.dataset.value || null;
```
```javascript
// Source: systems/spellslots/spellslots-ui.js:35-37 (toggleSpellSlot — bricht bei null/NaN hier ab)
function toggleSpellSlot(charId, level) {
    const ch = EntityLookup.character(charId);
    if (!ch || !ch.spellSlots || !ch.spellSlots[level]) return;   // Zeile 37 — stiller Abbruch
```
Da `party-render.js` `data-char`/`data-level`/`data-index` statt `data-id`/`data-value` setzt, liest
`event-delegation.js` `ctx.id = null` und `ctx.value = null`; `combat-actions.js:89` ruft
`toggleSpellSlot(ctx.id, parseInt(ctx.value))` → `toggleSpellSlot(null, NaN)` → sofortiger,
stiller Abbruch in Zeile 37. Bestätigt: `renderSpellSlotPips` (`spellslots-ui.js:59`) hat **null**
Aufrufer im ganzen Quellbaum (nur die eigene Definition und ein Eintrag in
`eslint.generated-globals.js`) — die tatsächlich funktionierende, gestylte Pip-Familie ist
`.slot-pip` (`dashboard.css:1320/1335/1340`), die dieselbe `spellslots-ui.js` bereits an anderer
Stelle (Zeile 81, Initiative-Kontext) korrekt mit `data-id`/`data-value` erzeugt.

### FIX-03 — Würfelfarbe (bestätigt exakt)

```javascript
// Source: features/dice/dice-core.js:336-365 (VOR dem Fix)
const heroContainer = $('dice-hero');
const heroResult = $('dice-hero-result');
if (heroContainer && heroResult) {
    // ...
    heroResult.className = '';                 // Zeile 345 — nimmt .dice-hero-result komplett weg
    // ...
    heroContainer.classList.remove('crit', 'fail');
    if (/* crit */) {
        heroContainer.classList.add('crit');    // landet auf dem CONTAINER, nicht auf heroResult
        createConfetti(heroContainer);
    } else if (/* fail */) {
        heroContainer.classList.add('fail');
    }
```
```css
/* Source: assets/styles/dice.css:21-37 */
.dice-hero-result {
    font-size: 5em;
    font-weight: 700;
    color: var(--gold);
    line-height: 1;
    transition: all 0.3s;
}
.dice-hero-result.crit { color: var(--green); text-shadow: 0 0 20px rgba(74,222,128,0.5); }
.dice-hero-result.fail { color: var(--red); text-shadow: 0 0 20px rgba(239,68,68,0.5); }
/* .dice-hero.crit / .dice-hero.fail existieren NIRGENDS im CSS-Baum (bestätigt: 0 Treffer) */
```
```css
/* Source: assets/styles/dice.css:677-693 (das funktionierende Vorbild, D-16) */
.fdp-number { ... }
.fdp-number.crit { ... }
.fdp-number.fail { ... }
```

## Runtime State Inventory

**Nicht anwendbar für DEAD-01/02/03 und FIX-01/02/03.** Diese Phase benennt keine Entität um und
verschiebt keine Datenbank-Schlüssel — sie löscht beweisbar toten CSS-Bestand und behebt drei
CSS/JS-Bugs. Geprüft und mit „nichts gefunden" bestätigt:

| Kategorie | Frage | Befund |
|-----------|-------|--------|
| Gespeicherte Daten | Referenziert `D` (der persistierte Datenschema-Baum, `core/data.js`) irgendeine der betroffenen CSS-Klassen (`dms-*`, `char-slot-*`, `pwa-install-banner`)? | **Nein** — `grep` gegen `core/data.js` liefert 0 Treffer für alle drei Präfixe. Widget-Layouts (`D.dmScreenLayout`) speichern `type: 'terrain'` etc., keine rohen CSS-Klassennamen. |
| Live-Service-Konfiguration | Gibt es externe Services (n8n, Datadog o. ä.), die diese Klassennamen referenzieren? | **Nein** — diese App hat keine solchen Integrationen; rein clientseitige Offline-App. |
| OS-registrierter Zustand | Task-Scheduler, pm2 o. ä. mit diesen Namen? | **Nein** — nicht anwendbar, Browser-App ohne OS-Prozessregistrierung. |
| Secrets/Env-Vars | Referenziert ein Secret-Key einen der betroffenen Namen? | **Nein** — dieses Projekt hat keine Secrets-Verwaltung (rein clientseitig, LocalStorage/IndexedDB). |
| Build-Artefakte | Enthält ein installiertes/gebautes Artefakt (`dist/`) die alten Klassennamen fest verdrahtet außerhalb des normalen Build-Laufs? | Die beiden `dist/*.html`-Bundles werden bei jedem `python build.py`/`--production`-Lauf komplett neu erzeugt (bestätigt: beide liefen in dieser Sitzung fehlerfrei durch) — kein separates Artefakt-Update nötig, ein Rebuild nach dem letzten Commit genügt. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Node.js | `tools/css-usage-report.js`, Jest, Playwright, `build.py`s Node-Aufrufe | ✓ | v24.14.0 (gemessen) | — |
| npm | Testausführung | ✓ | gemäß `package.json` | — |
| Python 3 | `build.py`, `pytest tests/build` | ✓ | läuft fehlerfrei (gemessen) | — |
| Playwright (Chromium) | E2E-Suite, neuer FIX-01/02/03-Spec | ✓ | 354 Fälle liefen in 2,1 min durch | — |
| Git | Ein-Commit-je-Datei-Disziplin (D-23) | ✓ | Repo ist ein Git-Repo | — |

**Keine fehlenden Abhängigkeiten.** Alle für diese Phase nötigen Werkzeuge sind bereits installiert
und funktionsfähig — bestätigt durch tatsächliche Testläufe in dieser Sitzung, nicht nur durch
Versionsabfragen.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Unit-Framework | Jest ^30.2.0, Konfiguration in `jest.config.cjs` |
| E2E-Framework | Playwright, Konfiguration in `playwright.config.js` |
| Build-Validierung | pytest (`tests/build/`), Python |
| Quick-Run (Unit) | `npx jest tests/unit/design-consistency.test.js` |
| Quick-Run (gezielt) | `npx jest <pfad>` |
| Full Suite (Unit) | `npx jest` (gemessen: 53 Suiten / 1217 Tests / 50 Snapshots, 3,19 s) |
| Full Suite (E2E) | `npx playwright test` (gemessen: 354 Fälle, 352 passed, 2 skipped, 2,1 min) |
| Full Suite (Build) | `python -m pytest tests/build -q` (gemessen: 24 passed, 0,89 s) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|-------------|
| BASE-01 | 13 Blocker als Entscheidung in `PROJECT.md` gebucht | Doku-Review (kein automatisierter Test) | manuelles Diff-Review gegen die 13 B-Nummern | n/a |
| BASE-02 | 36 korrigierte Zahlen in Handoff-Dateien eingearbeitet | Doku-Review | Stichproben-`grep` gegen die in D-08 gelisteten Korrekturstellen | n/a |
| BASE-03 | N-08 widerlegt, §8 in `PATCHES.md` als VERWORFEN markiert | Doku-Review + bestehende Ratsche | `grep -c "VERWORFEN (B-07" PATCHES.md` → 1 | n/a |
| BASE-04 | Jede neue Ratsche vorab mit dem Testausdruck selbst gemessen | Unit (Ratschen-Selbstprüfung) | Beweisprotokoll je Ratsche (D-49) | ✅ Vorbild vorhanden |
| DEAD-01/02/03 | Toter CSS-Bestand gelöscht, Suiten bleiben grün | Unit + E2E + Build | `npx jest && npx playwright test && python -m pytest tests/build && python build.py && python build.py --production` | ✅ (Löschwerkzeug ❌ Wave 0) |
| FIX-01 | `.dms-terrain-item`/`.dms-skill-header.str` gestylt am gebauten Bündel | E2E (`getComputedStyle`) | neuer Playwright-Spec (D-17) | ❌ Wave 0 |
| FIX-02 | `.slot-pip`/`.char-slot-pip`-Nachfolger klickbar, Zustand persistiert | E2E | neuer Playwright-Spec (D-17) | ❌ Wave 0 |
| FIX-03 | `#dice-hero-result` behält `font-size`/`color` nach Wurf, crit/fail sichtbar | E2E | neuer Playwright-Spec (D-17) | ❌ Wave 0 |
| GATE-03 | Neue Ratschen beidseitig rot-grün bewiesen | Unit (Selbsttest, kein CI-Automat) | Messprotokoll nach D-49-Checkliste | n/a (Verfahren, kein Testfile) |
| GATE-04 | Geltungsbereich CSS vs. JS/Templates pro Befund entschieden | Doku-Review | `PROJECT.md` § Übertrag (D-33) | n/a |
| GATE-05 | Nach jeder Welle alle Suiten grün, Build läuft, 4 Themes gesichtet | Unit + E2E + Build + manuell | volle Suiten-Kette + Sichtprüfung (D-53) | ✅ Kette vorhanden |

### Sampling Rate

- **Pro Task-Commit:** `npx jest tests/unit/design-consistency.test.js` (0,6 s) + betroffene
  gezielte Suite
- **Pro Wellen-Merge (BASE / FIX / Löschlauf):** volle Kette — `npx jest && npx playwright test &&
  python -m pytest tests/build && python build.py && python build.py --production`
- **Phasen-Gate:** volle Suite grün vor `/gsd-verify-work`, plus die in D-53 vorgesehene gezielte
  Vier-Themes-Sichtung (kein volles Rundenprotokoll — das ist erst ab Phase 16 vorgesehen)

### Wave 0 Gaps

- [ ] `tools/css-usage-report.js` — Node-Skript, Vorbild `tools/generate-eslint-globals.js`;
  produziert die vier DEAD-Basisgrößen und tote Klassen/Blöcke je CSS-Datei (D-20)
- [ ] Neuer Playwright-Spec für FIX-01/02/03 berechnete Endwerte (`getComputedStyle`, D-17)
- [ ] `DMS_UNSTYLED_MAX`-Ratsche in `tests/unit/design-consistency.test.js` (zählt regelfreie
  `dms-*`-Klassen aus `class`-Attributen, nicht aus `data-action`-Werten/IDs — D-17 warnt
  ausdrücklich vor der Verwechslung: 15 statt 32 ohne den Attribut-Filter)
- [ ] `prefers-reduced-motion`-Rückbau-Ratsche (genau 1 Treffer, in `core.css`, D-19)
- [ ] `declarationsOf()`-Erweiterung um `fonts.css`-Ausschluss (D-42, Vorarbeit für eine spätere,
  in dieser Phase NICHT geschriebene `font-weight`-Ratsche)
- [ ] `15-RATCHET-BASELINE.md` — Formvorbild `14-GATE-BASELINE.md`, letzter Plan-Schritt (D-26)

## Security Domain

`security_enforcement` ist nicht explizit auf `false` gesetzt — Abschnitt wird geführt, fällt aber
für diese Phase überwiegend leer aus, da keine neue Eingabe-, Auth- oder Netzwerkfläche entsteht.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V2 Authentication | nein | keine Auth-Fläche in dieser Phase |
| V3 Session Management | nein | unverändert |
| V4 Access Control | **randständig** | `core/constants.js` `CALL_ACTION_WHITELIST` ist ein Allowlist-Muster für `data-action="call"`; D-22 entfernt zwei verwaiste Einträge (`installPWA`, `dismissPWABanner`) — eine Verkleinerung der Angriffsfläche, keine Erweiterung |
| V5 Input Validation | nein | FIX-02 fügt keine neue Nutzereingabe hinzu — `data-id`/`data-value` laufen weiterhin durch `parseEntityId()` (unverändert in `ui/event-delegation.js`) |
| V6 Cryptography | nein | nicht berührt |
| V11 (XSS/Output-Encoding) | **randständig** | CSS-Löschung berührt kein `innerHTML`; FIX-01/02/03 fügen keinen neuen dynamischen HTML-String hinzu (FIX-02 ändert nur Attributnamen in einem bereits bestehenden Template-Literal, kein neuer Interpolationspunkt) |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Verwaister `CALL_ACTION_WHITELIST`-Eintrag bleibt nach Markup-Löschung stehen | Elevation of Privilege (theoretisch — toter Eintrag ohne erreichbaren Aufrufpfad) | D-22: Whitelist-Eintrag im selben Commit wie das Markup löschen, nicht separat vergessen |
| Ein neues `data-value`-Attribut in FIX-02 wird nicht gegen die Whitelist geprüft | Tampering | Nicht zutreffend hier — FIX-02 nutzt `data-action="toggle-spell-slot-stop"`, bereits registriert über `EventDelegation.registerAction`, kein `data-action="call"`-Pfad |

## Sources

### Primary (HIGH confidence — in dieser Sitzung gegen HEAD `522ad13` gemessen)

- `assets/styles/*.css` (20 Dateien, 27.141 Zeilen gesamt) — direkt gelesen/gegrept
- `features/dmscreen/dmscreen-widgets-reference.js`, `dmscreen-widgets-combat.js` — direkt gelesen
- `features/party/party-render.js:300-343` — direkt gelesen
- `features/dice/dice-core.js:336-400` — direkt gelesen
- `ui/event-delegation.js:80-190` — direkt gelesen
- `systems/spellslots/spellslots-ui.js`, `systems/spellslots/pwa-install.js` — direkt gelesen
- `core/constants.js:563-650` (CALL_ACTION_WHITELIST) — direkt gelesen
- `tests/unit/design-consistency.test.js` — direkt gelesen (Helper-Funktionen, Ratschen-Konstanten)
- `.planning/milestones/v1.2-phases/14-tests-gates/14-GATE-BASELINE.md` — direkt gelesen (Formvorbild)
- `.planning/PROJECT.md` (Zeilen 462/485, § Übertrag aus v1.2) — direkt gelesen
- Testläufe in dieser Sitzung: `npx jest`, `npx jest tests/unit/design-consistency.test.js`,
  `npx playwright test`, `python -m pytest tests/build -q`, `python build.py`,
  `python build.py --production`

### Secondary (MEDIUM confidence)

- `.planning/phases/15-befundlage-vorlauf/15-CONTEXT.md` — Nutzer-Entscheidungen D-01..D-55, als
  Vorgabe übernommen, dort wo diese Recherche sie unabhängig nachgemessen und bestätigt hat

### Tertiary (LOW confidence / offen)

- `438 tote Klassen / 607 Regelblöcke / ~3.174 Zeilen` (DEAD-01) — **nicht reproduzierbar in dieser
  Sitzung**, weil das dafür vorgesehene Werkzeug (`tools/css-usage-report.js`) noch nicht existiert.
  Als `[ASSUMED]` zu behandeln, bis das Werkzeug läuft — siehe Pitfall 5.
- `.skeleton` „12 von 12 Treffern" — gemessen **11**, siehe Pitfall 3. `[ASSUMED]` in CONTEXT.md,
  hier korrigiert auf den gemessenen Wert.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|-----------------|
| A1 | Die 438/607/~3.174-Zahlen (DEAD-01) sind methodenabhängig und werden erst vom noch zu bauenden `tools/css-usage-report.js` verbindlich | Pitfall 5, Sources (Tertiary) | Ein Plan, der diese Zahl vorab in ein Erfolgskriterium schreibt, könnte am Ende eine andere, aber ebenso korrekte Löschmenge liefern — REQUIREMENTS DEAD-01 muss laut D-20 selbst auf „die vom Werkzeug gemessene Menge" umformuliert werden |
| A2 | `.skeleton` hat 11, nicht 12 Treffer im Quellbaum | Pitfall 3 | Gering — ändert nichts an der Löschentscheidung selbst, nur am Kommentarwert der neuen Ratsche |
| A3 | Die GSD-Prozessdateien (`discuss-phase.md:238/243/308`, `gsd-planner.md:347`), die D-01/D-02/D-03 zitieren, wurden in dieser Sitzung nicht direkt gelesen (liegen außerhalb des Projekt-Repos, im globalen `.claude`-Verzeichnis) | (nicht im RESEARCH referenziert, aber Grundlage von D-01/D-02) | Gering — diese Zeilenangaben betreffen reine GSD-Tooling-Infrastruktur, nicht die App selbst; falls falsch, wäre nur der Ablageort der Blocker-Entscheidungen betroffen, nicht deren Inhalt |

**Risiko-Einordnung:** A1 ist der einzige Punkt mit Planungsrelevanz — der Plan MUSS den Werkzeugbau
vor jede Löschzahl stellen. A2/A3 sind kosmetisch bzw. außerhalb des App-Codes.

## Open Questions

1. **Wird `tools/css-usage-report.js` menschenlesbare Tabellen oder JSON ausgeben?**
   - Was wir wissen: D-20 verlangt „je CSS-Datei tote Klassen, tote Regelblöcke, Zeilen darin und
     die vier DEAD-03-Basisgrößen" als Ausgabe.
   - Was unklar ist: das exakte Ausgabeformat (Konsolen-Tabelle vs. JSON-Datei vs. Markdown-Report),
     das direkt in `15-RATCHET-BASELINE.md` einfließen soll.
   - Empfehlung: Konsolen-Tabellenausgabe (analog zu `tools/generate-eslint-globals.js`s
     Log-Stil) genügt — `15-RATCHET-BASELINE.md` zitiert die Ausgabe im Messprotokoll-Format wie
     `14-GATE-BASELINE.md`, kein separates maschinenlesbares Artefakt nötig, es sei denn eine
     spätere Phase will es automatisiert weiterverarbeiten.

2. **Wie genau sieht der Playwright-Stil-Diff-Lauf aus (D-24) — welche feste Eigenschaftsliste?**
   - Was wir wissen: „feste Eigenschaftsliste ohne `width`/`height`", je einmal mit
     `[data-layout="mobile"]` und emuliertem `prefers-reduced-motion`, Abzug vor dem ersten
     Löschcommit und nach jedem weiteren.
   - Was unklar ist: die genaue Eigenschaftsliste (vermutlich `color`, `background-color`,
     `font-size`, `box-shadow`, `border-color`, `opacity` — deckungsgleich mit den Eigenschaften,
     die die späteren Phasen 16-18 ändern werden) ist in CONTEXT.md nicht abschließend benannt.
   - Empfehlung: Der Plan sollte diese Liste als expliziten Task-Entscheid festlegen, orientiert an
     den in COLOR-*/TYPO-*/ELEV-* genannten Eigenschaften, damit der Diff über alle fünf Phasen
     hinweg vergleichbar bleibt.

## Metadata

**Confidence breakdown:**
- Standard-Stack: HIGH — keine neuen Abhängigkeiten, alle Werkzeuge bereits installiert und in
  dieser Sitzung lauffähig bestätigt
- Architektur (CSS-folgt-JS, Ratschen-Muster): HIGH — direkt aus bestehendem, gelesenem Code
  abgeleitet, kein externes Muster übernommen
- FIX-01/02/03-Fundstellen: HIGH — alle Datei:Zeile-Angaben in dieser Sitzung selbst gelesen und
  bestätigt, eine Verschärfung gefunden (Skill-Header-Klassennamen sind komplett verschieden, nicht
  nur spezifitätsschwach)
- DEAD-01-Zahlen: LOW — nicht reproduzierbar ohne das noch zu bauende Werkzeug; als offene Annahme
  geführt (A1)
- Pitfalls: HIGH — jeweils an konkretem, gelesenem Code festgemacht

**Research date:** 2026-09-08
**Valid until:** Bindend nur bis zum ersten Commit dieser Phase — jede Zahl in diesem Dokument ist
gegen HEAD `522ad13` gemessen; nach dem ersten BASE-/FIX-/Löschcommit sind Zeilenangaben in
`assets/styles/*.css` und den betroffenen JS-Dateien zu verschieben und ggf. neu zu messen.
