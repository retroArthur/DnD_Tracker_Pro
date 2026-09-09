---
phase: 15-befundlage-vorlauf
verified: 2026-09-09T00:00:00Z
status: gaps_found
score: 9/11 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "DEAD-01/DEAD-02 prohibition: das Werkzeug meldet niemals still eine Klasse als tot, deren Lebendbeleg ihm nur wegen einer unbekannten Konstruktion fehlt — eine unbeurteilbare Konstruktion wird laut ausgewiesen, nie still als tot gezaehlt"
    status: failed
    reason: "Code-Review-Fund CR-01 (15-REVIEW.md), unabhaengig nachgemessen und bestaetigt: tools/css-usage-report.js erkennt `.className = <ternary>` und `containerClass:`/`className:`-Objektschluessel nicht als Klassen-Kontext. Zwei reale Fundstellen (ui/dom-builder.js:393, ui/safe-render.js:360) weisen genau dieses Muster auf. Die Folge ist bereits eingetreten, nicht nur hypothetisch: die eigenstaendigen Regelbloecke fuer .npc-grid (npcs.css) und .list-view-container (encounters.css) wurden in Plan 15-07 als 'vollstaendig tot' geloescht. .list-view-container kommt inzwischen in keiner CSS-Datei mehr vor; .npc-grid ueberlebt nur zufaellig als Rest in einer Komma-Selektor-Liste (dashboard.css:577) und steht deshalb weiterhin auf der eigenen --check-Totenliste des Werkzeugs, ohne dass das je aufgeloest wurde. Aktuell ohne sichtbare Regression (renderNPCListOptimized/renderNPCListFast haben nachweislich keine Aufrufstelle im Quellbaum), aber der Fund ist nicht in WINDOWS.md dokumentiert und nicht behoben — anders als der (getrennte, tatsaechlich dokumentierte) --check-Restbefund zu den 204 Anker-geschuetzten Klassen."
    artifacts:
      - path: "tools/css-usage-report.js"
        issue: "collectLiveTokens() (Zeilen ~186-306) hat keinen Pfad fuer .className = <Ternary/Variable> oder containerClass:/className:-Objektschluessel; faellt bei genau der Konstruktion still auf 'tot' zurueck, die das DEAD-01-Verbot ausdruecklich als 'laut als unbeurteilbar auszuweisen' vorschreibt"
      - path: "assets/styles/npcs.css"
        issue: "Eigenstaendiger .npc-grid-Regelblock in Plan 15-07 geloescht; die Klasse steht weiterhin unaufgeloest auf der eigenen --check-Totenliste des Werkzeugs"
      - path: "assets/styles/encounters.css"
        issue: "Eigenstaendiger .list-view-container-Regelblock in Plan 15-07 geloescht; die Klasse ist aus dem CSS vollstaendig verschwunden und taucht im Werkzeug-Report nicht mehr auf"
    missing:
      - "collectLiveTokens() um containerClass:/className:-Objektschluessel und eine vollstaendige String-/Template-Literal-Suche innerhalb von .className = <Ausdruck>;-Anweisungen erweitern (mechanisch, nicht fallweise wie DEAD_EXCEPTIONS)"
      - "Bis dahin: .npc-grid und .list-view-container entweder wiederherstellen oder mit datiertem, begruendetem DEAD_EXCEPTIONS-Eintrag fuehren, statt die Luecke unaufgeloest zu lassen"
      - "Fund in .planning/WINDOWS.md nachtragen (getrennt vom bereits dort gefuehrten 204-Klassen-Fund), damit Phase 16-19 ihn nicht uebersehen, wenn sie sich auf dasselbe Werkzeug verlassen"
  - truth: "Die drei sachlich falschen Behauptungen in CLAUDE.md sind korrigiert: die Zahl der modularen CSS-Dateien ist 20"
    status: partial
    reason: "Die Modul-Organisations-Tabelle (CLAUDE.md:144) wurde korrekt auf '20 modulare CSS-Dateien' aktualisiert und per ls-Kommando bestaetigt (gemessen: 20). Der Abschnitt 'CSS Organization for New Features' (CLAUDE.md:759) weiter unten im selben Dokument behauptet jedoch weiterhin 'split into 13 modular files under assets/styles/' und listet nur 13 Dateien namentlich auf (7 fehlen: bestiary.css, command-palette.css, file-backup.css, fonts.css, migration.css, pwa.css, welt.css). Die Akzeptanzpruefung aus Plan 15-02 (grep -c \"13 modulare CSS-Dateien\" CLAUDE.md == 0) hat nur die woertliche deutsche Zeichenkette getroffen und die englische Formulierung 'split into 13 modular files' an anderer Stelle desselben Dokuments uebersehen — CLAUDE.md widerspricht sich jetzt selbst ueber dieselbe Zahl."
    artifacts:
      - path: "CLAUDE.md"
        issue: "Zeile ~759 ('CSS Organization for New Features') behauptet weiterhin 13 Dateien mit veralteter Dateiliste, waehrend Zeile 144 korrekt 20 nennt"
    missing:
      - "Den 'CSS Organization for New Features'-Abschnitt (Struktur-Codeblock UND Fliesstext) auf 20 Dateien nachziehen, inklusive der 7 fehlenden Eintraege in der Struktur-Auflistung"
deferred: []
human_verification:
  - test: "GATE-05 Stufe 3 — volle menschliche Vier-Themes-Runde nach Phase 15 (PROJECT.md § GATE-05, D-53-Ablehnung: keine reduzierte Stellenliste zulaessig)"
    expected: "Ein Mensch sichtet die App in allen vier Themes (Dark/Light/Sepia/Contrast), mindestens einschliesslich der drei Mindestumfang-Stellen dieser Phase: DM-Screen-Referenzwidgets Gelaende/Fertigkeiten/Wissensgebiete, Zauberplatz-Pips auf der Charakterkarte, Wuerfelergebnis der Hauptansicht inkl. Crit-/Patzerfaerbung"
    why_human: "GATE-05 selbst schreibt eine automatisierte Stufe 1 (Suiten/Build) und eine agentengestuetzte Stufe-2-Screenshot-Serie vor, verlangt aber ausdruecklich zusaetzlich eine echte menschliche Stufe-3-Runde als drittes, nicht ersetzbares Element; Plan 15-08 hat das korrekt NICHT als durchgefuehrt behauptet (12 Screenshots = Stufe 2, keine Stufe 3) und die Runde ausdruecklich der Phasen-UAT vorbehalten"
---

# Phase 15: Befundlage & Vorlauf Verification Report

**Phase Goal:** Vor der ersten Code-Zeile der Folgephasen stehen korrigierte Zahlen, entschiedene
Blocker, eine bereinigte CSS-Basis und ein verlaessliches Mess-Instrument — die 13 Blocker-
Entscheidungen sind gebucht, die Handoff-Zahlen korrigiert, drei sichtbare Defekte behoben, das
Dead-CSS-Werkzeug gebaut und der tote Bestand geloescht, das Nachmess-Protokoll geschrieben.
**Verified:** 2026-09-09
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Alle 13 Blocker (B-01..B-13) sind mit Entscheidung, Begruendung und Auswirkung gebucht | ✓ VERIFIED | `PROJECT.md` § "Blocker-Entscheidungen v1.3" (Zeilen 543-724): alle 13 Eintraege vollstaendig, keiner leer; Key-Decisions-Tabelle traegt Verweiszeilen fuer B-01..B-13 |
| 2 | Genau ein globaler `prefers-reduced-motion`-Block existiert, in `core.css` | ✓ VERIFIED | `grep -rn "prefers-reduced-motion" assets/styles/` → genau 1 Treffer, `core.css:2540`; Ratsche F-20 gruen (67/67 in `design-consistency.test.js`) |
| 3 | Der Loeschlauf senkt `assets/styles/` um die vom Werkzeug gemessene Menge toter Regelbloecke; danach sind Suiten gruen und Builds laufen durch | ✓ VERIFIED | `node tools/css-usage-report.js` → 0 tote Regelbloecke im ganzen Baum; Jest 1243/1243 (54 Suiten, 50 Snapshots) selbst nachgefahren; Playwright 364 passed/2 skipped selbst nachgefahren; pytest 24/24 selbst nachgefahren; `build.py --production` Exit 0 selbst nachgefahren |
| 4 | FIX-01/FIX-02/FIX-03 sind im gebauten Buendel sichtbar korrekt und funktional | ✓ VERIFIED | 9/9 Faelle in `tests/e2e/features/design-fixes.spec.js` gegen den frisch gebauten Bundle selbst ausgefuehrt (nicht nur zitiert) — Gelaende/Fertigkeiten/Wissensgebiete gestylt, Zauberplatz-Pip-Klick senkt Stand und uebersteht Reload, Wuerfelergebnis behaelt Formatierung inkl. Crit/Fumble; CSS-Regeln fuer alle drei (`.dms-terrain-item`, `.dms-skill-header.str`, `.dice-hero-result.crit/.fail`) im Quelltext bestaetigt |
| 5 | GATE-03 — jede neue Ratsche ist beidseitig rot-gruen bewiesen mit Ausgangswert im Kommentar | ✓ VERIFIED | `15-RATCHET-BASELINE.md` Nachtraege 1-5, je mit rotem und gruenem Exit-Code; eigenstaendig nachvollzogen fuer F-20/F-21 (Jest-Lauf bestaetigt aktuelle Grenzwerte) |
| 6 | GATE-04 — jede der sechs Befundgruppen ausserhalb `assets/styles/` traegt Phasenzuordnung oder Uebertragszeile; sieben harte Ausnahmen benannt, `sw.js` ausdruecklich ausgenommen | ✓ VERIFIED | `PROJECT.md` § GATE-04 (Zeilen 167-224): 3 Gruppen -> Phase 16/18, 3 Gruppen in "Uebertrag aus v1.3"-Tabelle mit Messbefehl+Zahl; 7 Ausnahmen namentlich mit Datei+Grund; `sw.js` ausdruecklich als NICHT-Ausnahme benannt |
| 7 | BASE-02 — 36 korrigierte Kennzahlen stehen in den Handoff-Dateien, Altwert bleibt sichtbar | ✓ VERIFIED | `CHECKLISTE.md` (163× statt 151/132+19), `BEFUNDE-v2.md` (32× statt 44×, 97 statt "fuenf weitere Stellen") — Altwerte an jeder Stelle als Vergleichswert erhalten, nicht ersetzt |
| 8 | BASE-03 — widerlegte Lieferantenaussage bleibt markiert, nicht entfernt; Zeilenspanne korrigiert | ✓ VERIFIED | `PATCHES.md` §8 traegt "VERWORFEN (B-07, 2026-09-08)"-Block mit Begruendung, Text nicht geloescht; `REQUIREMENTS.md`/`ROADMAP.md` nennen beide durchgaengig `dmscreen.css:1408-1419` (korrigierte Spanne), keine Reste von 1408-1414 |
| 9 | Die live PWA-Installationsroute uebersteht die Bannerloeschung | ✓ VERIFIED | `header.html:#pwa-install-btn` (`data-action="install-pwa"`) → `EventDelegation.registerAction('install-pwa', …)` → `installPWA()` in `systems/spellslots/pwa-install.js` — Kette vollstaendig intakt; nur die verwaisten `CALL_ACTION_WHITELIST`-Eintraege (`installPWA`, `dismissPWABanner`) fuer die tote `data-action="call"`-Route wurden entfernt (bestaetigt in `core/constants.js`) |
| 10 | DEAD-01/DEAD-02-Verbot: keine Klasse wird still als tot gemeldet, deren Lebendbeleg dem Werkzeug nur wegen einer unbekannten Konstruktion fehlt | ✗ FAILED | Siehe `gaps` — CR-01 (15-REVIEW.md), unabhaengig bestaetigt: `.npc-grid`/`.list-view-container` wurden wegen `.className = <Ternary>`/`containerClass:`-Blindstelle faelschlich als vollstaendig tot behandelt und geloescht |
| 11 | Die drei sachlich falschen CLAUDE.md-Behauptungen sind korrigiert (CSS-Dateizahl = 20, kein Werkzeugleisten-Waechter) | ⚠ PARTIAL (zaehlt als FAILED) | CSS-Dateizahl in der Modul-Tabelle korrekt (20, `CLAUDE.md:144`), Waechtertest-Behauptung korrekt als Restschuld umformuliert (`CLAUDE.md:462`) — aber `CLAUDE.md:759` widerspricht mit "split into 13 modular files" samt veralteter 13-Datei-Liste |

**Score:** 9/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.planning/PROJECT.md` | Blocker-Entscheidungen v1.3, GATE-04, Uebertrag-Tabelle, GATE-05 | ✓ VERIFIED | Alle Abschnitte vorhanden und inhaltlich vollstaendig |
| `CLAUDE.md` | Korrigierte CSS-Dateizahl, keine Waechtertest-Behauptung | ⚠ HOLLOW | Korrektur an einer Stelle vollzogen, an anderer Stelle (Zeile 759) widersprochen — siehe Gap 11 |
| `tools/css-usage-report.js` | Dreistufige Lebend-Erkennung, Basisgroessen, `--check`-Modus | ⚠ HOLLOW (methodischer Defekt) | Existiert, laeuft, `--check` korrekt Exit 1 (204 dokumentierte Anker-Ueberlebende) — aber Lebend-Erkennung hat eine unbeurteilbare-Konstruktion-Bluecke, die bereits einmal echtes Loeschen verursacht hat (CR-01) |
| `tests/e2e/features/design-fixes.spec.js` | Rot-gruen bewiesene FIX-01/02/03-Faelle | ✓ VERIFIED | 9/9 Faelle selbst gegen den Bundle ausgefuehrt, alle gruen |
| `tests/e2e/features/computed-style-diff.spec.js` | Dreidurchgang-Stildiff | ✓ VERIFIED | Existiert, Teil der gruenen 364-Playwright-Faelle |
| `tests/unit/css-usage-report.test.js` | Pinnt die Zaehlart | ✓ VERIFIED | Existiert |
| `.planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md` | Einziges Messprotokoll, Nachmessung aller Basisgroessen | ✓ VERIFIED | 7 Messbloecke, 5 Ratschen-Nachtraege mit beidseitigem Beweis, 4 offene Annahmen — Zahlen gegen den lebenden Baum stichprobenartig selbst nachgemessen und deckungsgleich |
| Anpassungen/…/PATCHES.md | Anker als Tripel (Datei+Zeile, Zitat, grep+Zahl) | ✓ VERIFIED | Jedes "Datei+Zeile:"-Vorkommen steht innerhalb eines "Anker (Tripel…)"-Blocks; kein Anker besteht nur aus einer Zeilennummer |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `assets/templates/header.html` (`#pwa-install-btn`) | `systems/spellslots/pwa-install.js` (`installPWA()`) | `data-action="install-pwa"` → `EventDelegation.registerAction` | ✓ WIRED | Bestaetigt per grep-Kette, Route unveraendert seit Bannerloeschung |
| `features/party/party-render.js` (`.slot-pip`) | `ui/event-delegation.js` | `data-id`/`data-value` | ✓ WIRED | e2e-Test bestaetigt: Klick senkt persistierten Stand |
| `features/dice/dice-core.js` (`heroResult`) | `assets/styles/dice.css` (`.dice-hero-result.crit/.fail`) | Klasse landet auf Ergebnis-Element, nicht Container | ✓ WIRED | e2e-Test bestaetigt Crit-/Patzer-Faerbung nach Wurf |
| `tools/css-usage-report.js` | `ui/dom-builder.js:393`, `ui/safe-render.js:360` | Klassen-Kontext-Erkennung fuer dynamische Zuweisungen | ✗ NOT_WIRED | Genau diese beiden Zuweisungsformen werden vom Werkzeug nicht erkannt (CR-01) |
| `.planning/ROADMAP.md` (Phasen 16-19) | `.planning/PROJECT.md` § Blocker-Entscheidungen v1.3 | `**Canonical refs**`-Zeile | ✓ WIRED | Alle vier Phasenbloecke tragen die Zeile mit drei Pfaden |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `--check` Exit-Code | `node tools/css-usage-report.js --check` | Exit 1, 204 Klassen ausserhalb Ausnahmeliste | ✓ PASS (bestaetigt bekannten, dokumentierten Zustand) |
| Reduced-Motion-Ratsche | `grep -rn "prefers-reduced-motion" assets/styles/` | Genau 1 Treffer, `core.css` | ✓ PASS |
| design-consistency-Ratschen | `npx jest tests/unit/design-consistency.test.js` | 67/67 bestanden | ✓ PASS |
| FIX-01/02/03 e2e | `npx playwright test tests/e2e/features/design-fixes.spec.js` | 9/9 bestanden gegen frisch gebauten Bundle | ✓ PASS |
| Vollstaendige Jest-Suite (einmalig) | `npx jest` | 1243/1243, 54 Suiten, 50 Snapshots | ✓ PASS |
| Vollstaendige Playwright-Suite (einmalig) | `npx playwright test --reporter=list` | 364 passed, 2 skipped, Exit 0 | ✓ PASS |
| pytest Build-Tests | `python -m pytest tests/build -q` | 24/24 bestanden | ✓ PASS |
| Production-Build | `python build.py --production` | Exit 0, Validierungen bestanden | ✓ PASS |
| `.npc-grid`/`.list-view-container` Ueberlebensstatus | `grep -n "npc-grid\|list-view-container" assets/styles/*.css` | `.npc-grid` nur in Komma-Listen (`dashboard.css:577`, `variables.css:430`); `.list-view-container` 0 Treffer | ✓ PASS (bestaetigt CR-01) |
| Aufrufstellen der betroffenen JS-Funktionen | `grep -rn "renderNPCListOptimized\|renderNPCListFast"` | Nur Definition/Export, keine Aufrufstelle | ✓ PASS (bestaetigt "latent", keine sichtbare Regression heute) |

### Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|---|---|---|---|
| BASE-01 | 15-02 | ✓ SATISFIED | 13 Blocker gebucht |
| BASE-02 | 15-03 | ✓ SATISFIED | Korrigierte Kennzahlen mit Altwert sichtbar |
| BASE-03 | 15-01 | ✓ SATISFIED | §8 markiert, nicht geloescht; Zeilenspanne korrigiert |
| BASE-04 | 15-01, 15-08 | ✓ SATISFIED | Ratschen vorab mit demselben Ausdruck gemessen (Baseline-Dokument) |
| DEAD-01 | 15-06, 15-07 | ⚠ TEILWEISE — wörtliche Anforderung erfuellt (0 tote Regelbloecke), zugehoeriges Verbot verletzt | 0 tote Regelbloecke bleiben (Kernanforderung erfuellt), aber die Prohibition "nie still als tot zaehlen" ist per CR-01 verletzt |
| DEAD-02 | 15-06, 15-07 | ⚠ TEILWEISE | Praefixerkennung funktioniert fuer die 5 eingefrorenen Praefixe; dieselbe CR-01-Luecke betrifft auch DEAD-02s Pflicht-Fehlalarm-Prinzip |
| DEAD-03 | 15-07, 15-08 | ✓ SATISFIED | Vier Basisgroessen frisch nach Loeschlauf gemessen, nicht fortgeschrieben |
| FIX-01 | 15-04 | ✓ SATISFIED | e2e bestaetigt |
| FIX-02 | 15-05 | ✓ SATISFIED | e2e bestaetigt |
| FIX-03 | 15-05 | ✓ SATISFIED | e2e bestaetigt |
| GATE-03 | 15-01, 15-04, 15-08 | ✓ SATISFIED | Rot-Gruen-Nachtraege vollstaendig |
| GATE-04 | 15-02 | ✓ SATISFIED | Sechs Gruppen vollstaendig gefuehrt |
| GATE-05 | 15-02, 15-06, 15-08 | ✓ SATISFIED (Stufe 1+2), Stufe 3 offen fuer UAT | Stufe 3 korrekt nicht als erledigt behauptet — siehe Human Verification |
| MOTION-05 | 15-01 | ✓ SATISFIED | Ein Block in core.css, kein `scroll-behavior: auto !important` |

Keine verwaisten Requirements — alle 14 IDs aus dem Phase-Requirements-Feld sind in mindestens einem Plan referenziert und in `REQUIREMENTS.md`/`ROADMAP.md` als Phase 15 gefuehrt.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `tools/css-usage-report.js` | 195 | `CLASS_LIST_CALL_RE` truncates at first `)` (WR-01, Code Review) | ⚠ Warning | Kein aktueller Fehltreffer bewiesen, aber robuste Luecke in einem sicherheitskritischen Werkzeug |
| `features/party/party-render.js` | 308-354 | `renderCompactSpellSlots()` dupliziert `renderSpellSlotPips()` fast woertlich (WR-02, Code Review) | ⚠ Warning | Zwei Stellen muessen bei kuenftigen Aenderungen am Pip-Vertrag synchron gehalten werden |
| `.planning/ROADMAP.md` | 112 | `**Plans**: 6/8 plans executed in 6 waves` — stale Fortschrittszaehler, obwohl alle 8 Plaene als `[x]` gefuehrt sind | ℹ Info | Kosmetischer Bookkeeping-Fehler, kein funktionaler Gap (bekannte GSD-Eigenheit) |

Keine TBD/FIXME/XXX-Debt-Marker in den in dieser Phase geaenderten Dateien gefunden.

### Human Verification Required

### 1. GATE-05 Stufe 3 — volle Vier-Themes-Runde nach Phase 15

**Test:** Die App von Hand in allen vier Themes (Dark/Light/Sepia/Contrast) durchgehen, mindestens
einschliesslich der drei Mindestumfang-Stellen: DM-Screen-Referenzwidgets Gelaende/Fertigkeiten/
Wissensgebiete, Zauberplatz-Pips auf der Charakterkarte, Wuerfelergebnis der Hauptansicht
(inkl. Crit-/Patzerfaerbung).
**Expected:** Alle drei Bereiche sehen in jedem der vier Themes korrekt aus; keine Layoutbrueche
an den 5.148 geloeschten Zeilen sind sichtbar.
**Why human:** PROJECT.md § GATE-05 verlangt ausdruecklich eine echte menschliche Stufe-3-Runde
zusaetzlich zu Stufe 1 (automatisiert) und Stufe 2 (agentengestuetzte Screenshot-Serie, in Plan
15-08 bereits durchgefuehrt) — der Nutzer hat eine Reduktion hierauf am 2026-09-09 ausdruecklich
abgelehnt (D-53). Plan 15-08 hat dies korrekt nicht als erledigt ausgegeben.

### Gaps Summary

Neun von elf pruefbaren Wahrheiten sind sauber verifiziert, mit direkter, eigenstaendiger
Nachmessung (nicht nur SUMMARY-Zitat): alle 13 Blocker-Entscheidungen sind vollstaendig, die
Ratschen sind beidseitig rot-gruen bewiesen und aktuell gruen, die drei sichtbaren Defekte
(FIX-01/02/03) sind per e2e-Test gegen den frisch gebauten Bundle bestaetigt funktional, GATE-04s
Geltungsbereich ist lueckenlos dokumentiert, und die PWA-Installationsroute ist intakt.

Zwei Luecken bleiben:

1. **CR-01 (Code-Review, unabhaengig bestaetigt):** Das in dieser Phase gebaute Dead-CSS-Werkzeug
   — genau das Instrument, auf das sich die Phasen 16-19 verlassen sollen — hat eine bewiesene,
   nicht hypothetische Blindstelle bei `.className = <Ternary>`/`containerClass:`-Zuweisungen.
   Diese Blindstelle hat in Plan 15-07 bereits zur Loeschung zweier eigenstaendiger CSS-Regeln
   gefuehrt (`.npc-grid`, `.list-view-container`), die exakt das Muster tragen, das die
   DEAD-01/DEAD-02-Verbote ausdruecklich ausnehmen wollten ("eine unbeurteilbare Konstruktion wird
   laut als unbeurteilbar ausgewiesen, niemals still als tot gezaehlt"). Aktuell ohne sichtbare
   Regression, weil die einzigen JS-Aufrufer der betroffenen Funktionen selbst tot sind — aber der
   Fund ist unbehoben und, anders als der bereits in WINDOWS.md gefuehrte 204-Klassen-Restbefund,
   nirgends als offene Restschuld verzeichnet.
2. **CLAUDE.md widerspricht sich selbst:** Die Korrektur der CSS-Dateizahl (13 → 20) wurde an
   einer Stelle vorgenommen (Modul-Organisations-Tabelle), aber eine zweite, englischsprachige
   Behauptung ("split into 13 modular files") mit veralteter 13-Datei-Auflistung blieb im selben
   Dokument stehen, weil die Akzeptanzpruefung des Plans nur nach der deutschen Zeichenkette
   gegrept hat.

Beide Luecken sind klein im Umfang, aber inhaltlich genau die Art von Fund, die diese Phase
verhindern sollte (stille Fehlklassifikation, ungenaue Dokumentation) — deshalb `gaps_found`
statt `passed`, trotz einer ansonsten sehr sauber durchgefuehrten und ehrlich dokumentierten Phase.

---

_Verified: 2026-09-09_
_Verifier: Claude (gsd-verifier)_
