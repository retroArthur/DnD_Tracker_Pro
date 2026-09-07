# D&D Kampagnen-Tracker Pro

## What This Is

Ein offline-first Single-Page D&D 5e Kampagnen-Manager (pures JavaScript/HTML/CSS, deutsche UI, v2.6.1), den der Entwickler selbst als Spielleiter am Tisch nutzt — wahlweise per Doppelklick auf die gebaute HTML-Datei (`file://`) oder als **installierbare PWA** (GitHub Pages). Mit v1.0 „Stabilisierung & Ausbau" ist die einst nicht startende App ein vollständiges, getestetes Spielleiter-Werkzeug: Bestiary, Kampf-Tiefe, Weltwerkzeuge, Spieler-Verwaltung, Soundboard und Würfel-Statistiken.

## Core Value

Die App muss am Spieltisch **zuverlässig offline laufen** — ein Spielleiter-Begleiter, der nie im Weg steht und keine Daten verliert.

## Current State (v1.2 shipped 2026-09-07)

- **Version:** v2.6.1, Milestones **v1.0**, **v1.1** und **v1.2 „Schulden-Abbau"** geshippt (14 Phasen, 109 Pläne)
- **Codebase:** 136 Module, non-ESM Single-Bundle via `build.py`; `loader.js` ist alleinige Modulliste (ARCH-01)
- **Qualität:** **1217 Jest-Tests** (53 Suiten), **354 Playwright-Tests** (2 skipped), **24 pytest-Build-Tests** — alle grün. `no-undef: error`, Warnungs-Ratsche auf 367 gepinnt, strikter Typecheck über eine 8-Datei-Zulassungsliste, Coverage-Gate läuft jetzt in CI
- **Verifikation:** alle drei Phasen `passed`, `threats_open: 0` über 12/13/14, Nyquist 12 COMPLIANT · 13 COMPLIANT · 14 PARTIAL
- **Live:** https://retroarthur.github.io/DnD_Tracker_Pro/dnd-tracker-optimized.html

**Was v1.2 gebracht hat:** Der `DEBT`-Backlog aus der v1.1-Triage ist abgearbeitet — 26 Posten über
19 Requirements. Datenverlust-Risiken in Backup, Export und Migration geschlossen (Umzugs-Export
nimmt IndexedDB mit, Audio-Löschen ist rückgängig, das Datei-Backup kann seine eigene gute Sicherung
nicht mehr durch ein leeres Schema überschreiben). `call`-Aktionen laufen gegen eine 130-Einträge-
Whitelist. Vier Module mit 1500–1900 Zeilen in 14 Dateien aufgeteilt, alle ≤ 800 Zeilen, abgesichert
durch einen vorab eingefrorenen Charakterisierungs-Snapshot. `execCommand` jetzt auf **0** im ganzen
Quellbaum (die drei dokumentierten Ausnahmen aus v1.1 sind weg).

**Was der Milestone-Audit zusätzlich fand — beide Male, weil auf echten Nachweisen bestanden wurde:**
Ein in Phase 14 gebautes Coverage-Gate war korrekt kalibriert, lief aber **nirgends** (CI fuhr blankes
`npm test`, `collectCoverage: false`). Und ein totes Aktionsziel (`populateImportNodesList`) stand
weiter in der Handler-Whitelist und ging in beide Bundles, obwohl das Plan-Summary ausdrücklich das
Gegenteil behauptete. Beide am 2026-09-07 geschlossen, letzteres mit einem stehenden Wächter.


### Zwischenarbeit nach v1.2 (2026-09-07, 29 Commits, ausserhalb des GSD-Ablaufs)

Zwei Design-Handoffs kamen nach dem Archivieren von v1.2 herein und wurden
direkt abgearbeitet — ohne Phase, Plan oder SUMMARY. **Das ist bewusst hier
vermerkt und nicht rueckwirkend als Phase gebucht:** v1.2 ist geshippt und
getaggt, und die Arbeit gehoert der Sache nach vor v1.3, nicht in v1.2 hinein.

**1. Texterstellung, Variante 2a** (`Anpassungen/Texterstellung verbessern …`,
22 Arbeitspakete W-01..W-22, 10 Commits)

- Das Markup **aller 24 Editor-Werkzeugleisten** kommt jetzt aus EINER Quelle:
  `buildEditorToolbar()` in `ui/editors/editor-toolbar-build.js`. Die 22
  statischen Leisten schreibt `tools/sync-editor-toolbars.js` daraus;
  `--check` meldet Drift. Drei Stufen (minimal/mid/full), dreizeilige Leiste
  auf 43 px zusammengezogen.
- Bausteine (Statblock, Wuerfeltabelle, Trenner) als **klassenbasierte** Knoten
  — `sanitizeHTML()` streicht alle `data-*`, und die Stil-Erlaubnisliste kennt
  weder `border-left` noch `display`. Ein per `data-*` markierter Baustein waere
  nach dem ersten Speichern kaputt gewesen.
- Formaterhaltender Einfuegefilter, Block-Handle, Kopf-/Statuszeile fuer die
  beiden Langform-Editoren, abschaltbare Werkzeug-Blase.
- Die execCommand-Schranke deckt jetzt den **ganzen Quellbaum** ab und prueft
  auf den Aufruf statt auf die Erwaehnung.

**2. Design-Konsistenz** (`Anpassungen/Design-Konstanz …`, 19 Befunde
F-01..F-19, 19 Commits)

| | vorher | jetzt |
|---|---|---|
| Undefinierte Custom Properties | 19 | 0 |
| `rem` neben `px` | 253 | 0 |
| Hex-Literale ausserhalb `:root` | 240 | 0 |
| Radius-Werte | 14 | 3 |
| Breakpoint-Grenzen | 16 | 3 |
| Mehrfach definierte Selektoren | 67 | 0 |
| `!important` | 132 | 105 (alle begruendet) |
| Leerzustands-Familien | 17 | 3 Muster |
| z-index-Werte | 24 | 7 Stufen |

**Drei echte Defekte, die der Auditbericht nicht genannt hatte:**

1. Die App fuehrte **zwei Schadensarten-Farbsaetze**, die in fuenf von elf Typen
   abwichen — bei `acid` und `poison` waren die Farben zwischen Schnellreferenz
   und DM Screen **vertauscht**. Dieselbe Schadensart hatte je nach Bildschirm
   eine andere Farbe.
2. Die Bestiar-Filter waren **per Tastatur nicht erreichbar** (`display:none`
   auf der Checkbox nimmt sie aus der Tab-Reihenfolge).
3. `.btn-success:hover` stand auf `#16a34a` — dem Wert von `--green` im hellen
   Theme. Dort war die Hover-Rueckmeldung unsichtbar.

Alle drei behoben und mit Tests gesichert. Punkt 2 und 3 kamen aus einer
adversarischen Gegenprobe, nicht aus der eigenen Durchsicht.

**Neuer Testbestand:** `tests/unit/design-consistency.test.js` (64 Tests) haelt
jeden der 19 Befunde als messbares Kriterium fest, inklusive zweier Ratschen
(Dubletten, `!important`), die nur sinken duerfen.

<details>
<summary>Stand bei v1.1 (shipped 2026-07-27)</summary>


- **Version:** v2.6.1, Milestones **v1.0 „Stabilisierung & Ausbau"** und **v1.1 „Tech-Debt & Härtung"** geshippt (11 Phasen, 71 Pläne)
- **Codebase:** 123 Module, non-ESM Single-Bundle via `build.py` (eine Modulliste in `loader.js` als Single Source of Truth, Hard-Abort bei fehlender Datei)
- **Qualität:** **628 Jest-Tests**, **319 Playwright-Tests** (2 skipped), **24 pytest-Build-Tests** — alle grün. Sechs CI-Jobs, davon `e2e` und `smoke-test` blockierend vor dem Pages-Deploy. Alle Phasen-VERIFICATIONs `passed`, Nyquist 4/4 `validated`
- **Live:** https://retroarthur.github.io/DnD_Tracker_Pro/dnd-tracker-optimized.html (PWA installierbar, SW-Updates, Datei-Backup, Migrations-Wizard)

**Was v1.1 gebracht hat:** `document.execCommand` vollständig abgelöst (21 → 0 im Editor, drei
dokumentierte Ausnahmen ausserhalb), abgesichert durch ein 79-Test-Netz, das *vor* der Migration
gegen eine gemessene Markup-Baseline stand. Import-XSS geschlossen, Sanitizer-Tests laufen gegen den
Produktionsquelltext statt gegen eine Kopie. Build-Dedup-Pass 3 ersatzlos entfernt und durch einen
Quell-Pre-Check *vor* dem Bündeln ersetzt. CI auf Node 22, deprecation-frei — durch einen echten
Lauf belegt.

**Zwei Funde, die erst das Bestehen auf echten Nachweisen sichtbar machte:** eine unvollständige
CI-Artefakt-Paketierung (der `smoke-test` prüfte ein Artefakt ohne Service Worker) und ein stiller
Datenverlust im Datei-Backup ab 5 MB Kampagnengröße, bei dem `pruneOldSnapshots()` binnen zehn
Spieltagen alle echten Snapshots wegräumte — bei grüner Statusanzeige. Beide behoben.

</details>

## Next Milestone: v1.3 (noch nicht aufgesetzt)

**Der `DEBT`-Backlog ist leer.** v1.3 ist damit erstmals seit v1.0 wieder frei für Features statt
Schuldenabbau. Was aus v1.2 als *bewusst geführte* Restschuld übrig bleibt — vollständig in
`milestones/v1.2-MILESTONE-AUDIT.md`, hier als Übertrag, damit es das Archivieren überlebt:

| Posten | Herkunft | Kern |
|--------|----------|------|
| **NQ-03..NQ-11** (9 Punkte) | `14-VALIDATION.md` | Die drei Gate-Ratschen (`--max-warnings 367`, `tsconfig.strict`-Include, `MODULE_TEST_EXCEPTIONS`) sind reine Prosa-Regeln; zwei haben sich bereits gegen die eigene Vorschrift bewegt. `14-GATE-BASELINE.md` ist in fünf Zahlen veraltet. Beide stehenden Gates hängen an EINEM ungeprüften Extraktor. |
| **`npm run check` ist rot** | NQ-09 | `format:check` scheitert an **224 versionierten Dateien** (Stand 2026-09-07; die im Audit genannten 132 waren vor der Zwischenarbeit), und CI fährt `format:check` gar nicht — obwohl `npm run check` erklärtes Akzeptanzkriterium zweier Pläne war. Billigster Einstieg: einmal `npm run format`, dann den Schritt in CI aufnehmen. |
| **Aufteilung vs. Abdeckungs-Gate** | Cross-Phase | 7 von 8 Phase-13-Aufteilungsdateien stehen auf `MODULE_TEST_EXCEPTIONS`. Die Aufteilung geschah für Testbarkeit — eingelöst ist sie erst, wenn diese Dateien echte Tests bekommen. |
| **`DEBT-01` teiloffen** | TEST-05 | `tsconfig.strict.json` deckt 8 von 134 Dateien. Bewusst, mit gemessenen Zahlen benannt. |
| **2 Bedienabnahmen offen** | `13-VALIDATION.md` | Editor-Bediengefühl nach dem `rich-text.js`-Split, DM-Screen-Masonry bei 320/768 px. Subjektiv, funktional abgedeckt. |
| ~~**Doku-Drift**~~ | Audit | ~~`CLAUDE.md` behauptet weiterhin drei verbliebene `execCommand`-Aufrufe~~ — **erledigt** in der Zwischenarbeit (W-22): die Stelle nennt jetzt den gemessenen Stand (null Aufrufe) samt Datum und erklärt die zwei verbliebenen Kommentar-Nennungen in `utils/basic.js`. |

**Zurückgestellt:** Soundboard Per-Track-Play (Layering — Design aus der v1.0-Session liegt bereit).

<details>
<summary>Zielsetzung v1.2 (bei Milestone-Start)</summary>

### v1.2 Schulden-Abbau

**Goal:** Die 26 in der v1.1-Triage erfassten `DEBT`-Posten abarbeiten — allen voran die
Datenverlust-Risiken in Backup, Export und Migration — damit der Backlog leer ist und v1.3 wieder
Features bringen kann.

**Target features:**

- **Datensicherheit** (`DEBT-18, 19, 20, 21, 22, 05, 08, 11`) — Umzugs-Export erfasst
  IndexedDB-Inhalte; Datei-Backup deckt alle Kampagnen ab und kollidiert nicht bei Namen;
  Audio-Löschen ist rückgängig zu machen; Undo-Stack bleibt bei Parse-Fehlern konsistent;
  Persistenz-Randfälle sind getestet
- **Sicherheit** (`DEBT-23, 14`) — `call`-Aktion mit Ziel-Whitelist, Regex-Capture in
  `parseWikiLinks()` escapt
- **Performance** (`DEBT-06, 07, 24`) — Undo-Snapshots und Save-Serialisierung entlasten,
  Würfelstatistik-Store begrenzen
- **Wartbarkeit** (`DEBT-04, 25, 27, 09, 10, 16, 12, 13, 03`) — vier Module mit 1500–1900 Zeilen
  aufteilen, `const D`-Überschattung beseitigen, tote Seeds und die letzten drei
  `execCommand`-Reste entfernen
- **Tests & Gates** (`DEBT-15, 28, 01`) — Toast-Race schließen, die fünf ungetesteten Welt-Features
  abdecken, Lint-/Typecheck-/Coverage-Gates schärfen
- **Doku** (`DEBT-26`) — veraltete Kopfkommentare im Datei-Backup

**Key context:**

- Jeder Posten trägt bereits einen **Live-Code-Beleg** aus der Phase-11-Triage
  ([`11-CONCERNS-TRIAGE.md`](milestones/v1.1-phases/11-architektur-build-hygiene/11-CONCERNS-TRIAGE.md)) — die
  Recherche ist zu großen Teilen erledigt.
- **Reihenfolge ist nicht beliebig:** Datensicherheit zuerst, weil `DEBT-18` einen *irreversiblen*
  Verlust beim einmaligen, angeleiteten Umzug `file://` → PWA bedeutet.
- **`DEBT-01` (schwache Gates) gehört ans Ende**, nicht an den Anfang — schärfere Coverage-Gates auf
  einer Codebasis, die gerade in vier Modulen aufgeteilt wird, arbeiten gegen sich selbst.
- **Anders als v1.1 ist dieser Milestone NICHT verhaltensneutral.** `DEBT-18/19/21/22` ändern
  spürbar, was gesichert und wiederherstellbar ist.
- `DEBT-02` wurde beim Aufsetzen als bereits erledigt erkannt (Plan 11-07 hat es mit abgeräumt) und
  ist deshalb nicht Teil dieses Milestones — 26 statt 27 Posten.

**Lohnende Richtung über die Liste hinaus:** die Fehlerklasse hinter `DEBT-17` systematisch
verfolgen — zwei Subsysteme, die sich nur implizit auf einen Vertrag verlassen, plus ein Prüfaufbau,
der die Naht nie durchläuft. Der Integration-Check fand im v1.1-Scope keinen zweiten Fall, hat aber
nur gezielt und nicht erschöpfend gesucht.

**Zurückgestellt:** Soundboard Per-Track-Play (Layering — Design aus der v1.0-Session liegt bereit).

<details>
<summary>Frühere Milestone-Stände</summary>

### Stand bei v1.0 (shipped 2026-07-22)

- **Version:** v2.6.1, Milestone **v1.0 „Stabilisierung & Ausbau"** geshippt (7 Phasen, 44 Pläne, 31/31 Requirements, UAT 20/20)
- **Codebase:** ~123 Module, ~81.000 Zeilen Quellcode, non-ESM Single-Bundle via `build.py`
- **Qualität:** 457 Unit-Tests grün, volle E2E-Suite grün (231 passed / 2 skipped / 0 failed), CI mit Pages-Deploy und blockierendem E2E-Gate; alle 8 Phasen-VERIFICATIONs `passed`
- **v1.1-Fortschritt:** Phase 8 „Test-Fundament grün" abgeschlossen (2026-07-23) — TEST-01/TEST-02 validiert, E2E-Job blockiert seitdem die Deploy-Kette (`docs/e2e-failure-triage.md` dokumentiert alle Ex-Fails); Phase 9 „Editor-Regressionsnetz & execCommand-Ablösung" abgeschlossen (2026-07-25) — EDIT-01/EDIT-02/EDIT-03 validiert, Rich-Text-Editor execCommand-frei (21→0 via Selection/Range), abgesichert durch 80-Tests-Regressionsnetz mit D-04a-Doppel-Grün-Beweis (E2E-Suite jetzt 308 passed / 2 skipped)
- **Live:** https://retroarthur.github.io/DnD_Tracker_Pro/dnd-tracker-optimized.html (PWA installierbar, SW-Updates, Datei-Backup, Migrations-Wizard)

### Zielsetzung v1.1 (bei Milestone-Start)

**Goal:** Die Codebasis schuldenfrei und dauerhaft wartbar machen — deprecated APIs ablösen, Test-Suite vollständig grün, Sicherheits-Altlasten schließen, Build-/Architektur-Hygiene — ohne Verhaltensänderungen am Spieltisch.

**Target features:**
- execCommand-Ablösung: Rich-Text-Editor von 21 deprecated `document.execCommand`-Stellen auf moderne Selection/Range-DOM-APIs, verhaltensgleich
- Test-Suite grün + gehärtet: die 11 vorbestehenden E2E-Fails auf 0, brüchige Assertions gehärtet
- Security nachgezogen: vorbestehender Import-XSS, Security-Audits (SECURITY.md) für offene Phasen
- Architektur-Hygiene: Modullisten-Sync robust, build.py-Dedup-Schwächen, CI-Deprecations (Node 20), Codebase-Map-Refresh, CONCERNS.md-Restposten

**Zurückgestellt auf später:** Soundboard Per-Track-Play (Layering — Design aus v1.0-Session liegt bereit)


</details>

</details>

## Requirements

### Validated

<!-- Aus dem bestehenden Code abgeleitet (.planning/codebase/, 92 Module, ~29k Zeilen). -->

- ✓ Party-Verwaltung (HP/AC/Conditions, Party-Übersicht, Rest-Manager) — existing
- ✓ NPC-Verwaltung mit Beziehungssystem (Relations, Status-Level) — existing
- ✓ Orte, Quests, Wiki, Session-Notizen mit Rich-Text + Markdown — existing
- ✓ Encounter-Verwaltung + Balance-Rechner (Gelände-/Lair-Modifikatoren) — existing
- ✓ Initiative-Tracker mit Death Saves, Concentration, AoE-Schaden, Quick Actions — existing
- ✓ Zauber-Datenbank (deutsche SRD-Zauber) + Spell-Slot-Tracking — existing
- ✓ Loot/Truhe + Verteilung, Shops mit Handout-HTML-Export — existing
- ✓ Würfel-Roller (Floating Panel, Favoriten) + Random Tables — existing
- ✓ DM Screen mit 21 Widget-Typen und Profilen — existing
- ✓ Multi-Kampagnen-Verwaltung (getrennte LocalStorage-Keys) — existing
- ✓ Globale Fuzzy-Suche, Undo/Redo, Auto-Backups (LocalStorage + IndexedDB), Event-Log, Timer, Kalender — existing
- ✓ Build-System (`build.py` bündelt 92 Module in eine HTML-Datei), CI-Pipeline, Jest + Playwright Tests — existing

**Validated in Phase 1: Stabilisierung (2026-06-12):**

- ✓ App startet fehlerfrei via `file://` — `clearMindmap`-Boot-Crash (tools/debug.js) behoben, Smoke-Tests 7/7
- ✓ Mindmap-Reste vollständig bereinigt (debug.js, campaign-manager Seed, types/\*.d.ts, styles-purged.css, tests, tools)
- ✓ Frische Builds (dev + production) aus aktuellem Quellcode, Konsole fehlerfrei in allen Tabs
- ✓ Lint/Typecheck/Format grün (`npm run check` Exit 0, dauerhaft — Lint-Gate error-only, Prettier-Massenformatierung)
- ✓ Repo gepflegt: CI grün, tote Dateien/Tools entfernt (main.js, tsconfig.json.backup, veraltete tools/\*.py, validate.py repariert)
- ✓ Doku aktuell: CLAUDE.md, README, docs/bugfixes.md auditiert; Lizenz einheitlich MIT; SRD-Herkunft dokumentiert
- ✓ Persistenz-Härtung: >5-MB-Stale-Shadow-Fix, Export-Versionsstempel, LS/IDB-Konfliktauflösung ohne Rekursion (`resolveStorageConflict`)

**Validated in Phase 2: Technik-Fundament (2026-06-13):**

- ✓ PWA installierbar: echtes `manifest.webmanifest`, Cache-First-Service-Worker mit Update-Hinweis statt Force-Reload, lokal gebündelte Fonts, d20-App-Icon (192/512, maskable), Header-Install-Button, GitHub-Pages-Deploy-Job in der CI (TECH-01)
- ✓ Migration file:// → PWA: Voll-Export aller Kampagnen + Einstellungen + Würfel-Favoriten + DM-Profile, 4-Schritt-Wizard mit Divergenz-Schutz (TECH-02)
- ✓ Automatisches Datei-Backup via File System Access API: laufende `-aktuell.json` je Kampagne + datierte Tages-Snapshots (max. 10), IDB-Handle-Persistenz, Restore-Browser mit Undo-Schutz, file://-Download-Fallback (TECH-03)
- ✓ Command Palette (`Strg+Shift+K`): Aktions-Registry mit Fuzzy-Suche (Wiederverwendung `fuzzyMatch`), Tastaturnavigation (TECH-04)
- ✓ Qualitätszyklus: Code-Review mit 23 behobenen Findings (11 Critical, u. a. TDZ-Bundle-Crash), 300/300 Unit-Tests, Smoke-E2E 7/7 gegen Production-Bundle
- Offen als UAT (02-HUMAN-UAT.md): 6 manuelle Browser-Tests inkl. einmaliger GitHub-Pages-Aktivierung (Settings → Pages → Source: „GitHub Actions")

**Validated in Phase 3: Bestiary (2026-06-13):**

- ✓ Bestiary-Tab: 112 deutsche SRD-5.1-Statblocks offline (inline, `getSRDMonsters()` Lazy-Cache, nie in `D`), Liste mit Einzel-Pass-Filter/CR-Sortierung/Virtual-Scroll, klassischer 5e-Pergament-Statblock mit klickbaren Würfeln (BEST-01)
- ✓ Eigene Kreaturen: `bst-*`-Editor (volles D-04-Schema), CRUD mit Undo, geteilter Render-/Würfel-Pfad mit SRD-Monstern (BEST-02)
- ✓ Übernahme: „Zur Initiative" (Mengen-Dialog, DoS-Cap 100, Auto-Wurf, ±10% HP-Variation, Nummerierung, statblockRef) und „Zu Encounter" (korrekte HP/AC, Undo-bar) (BEST-03)
- ✓ Qualitätszyklus: Verifikation 14/14 must-haves, Production-Build + 308/308 Unit + 11/11 Bestiary-E2E grün, Code-Review (3 Critical + 3 Warnings) vollständig behoben — inkl. Regression im Encounter-Template-Loader durch den `getMonsterTemplates()`-SRD-Alias
- Offen als manuelle Checks (03-VERIFICATION, nicht-blockierend): Offline-Anzeige aller 112 Monster, Pergament-Optik, Klick-Würfel-Feel

**Validated in Phase 4: Initiative-Erweiterungen (2026-06-14):**

- ✓ Statblock-Drawer: 📖-Button je Initiative-Zeile öffnet einen rechts angedockten Drawer (mobil Bottom-Sheet) mit vollem Statblock (geteilte `renderStatblockHTML`, DRY) bzw. Basisinfos; klickbare Würfel, sanitize-then-dice (INIT-01)
- ✓ Legendäre Aktionen & Resistenzen: klickbare Pips in Death-Save-Optik; LA-Auto-Reset bei Init 20 (D-10), LR KEIN Auto-Reset + manueller Reset (D-07, regelkonform); Feld-Init beim Bestiary-Add (INIT-02)
- ✓ Mob-Modus: N>1 identische Monster als eine Pool-HP-Zeile mit „X von N am Leben", zwei Sammel-Angriffsmodi (N-fach + DMG-Mob-Regel), auto-summierter Schaden, Feature-Hiding, Undo-sicheres Auflösen (INIT-03)
- ✓ Qualitätszyklus: Verifikation 3/3 Wahrheiten, Build sauber + 288/288 Unit + Initiative-E2E grün, Code-Review (keine Phase-4-eigenen Critical-Bugs); UAT vom Nutzer approved nach Drawer-Bugfix (links→rechts, schließbar). Test-Härtung: 16 vorbestehend kaputte/no-op Initiative-E2E-Tests repariert → 31/31 grün

**Validated in Phase 6: Spieler-Verwaltung (2026-06-16):**

- ✓ Fundament: `XP_LEVEL_THRESHOLDS` (20-wertige PHB-Tabelle, getrennt von `XP_THRESHOLDS`/Encounter), vier reine DOM-unabhängige Regel-Helfer (`calcSkillModifier`/`canLevelUp`/`getXPForCR`/`distributeXP`), Schema-Migration 5.0.0 (backfillt `xp`/`skillProficiencies`/`skillExpertise`/`attacks`, `settings.levelingMode`)
- ✓ Inspiration (CHAR-02): immer sichtbarer klickbarer ☆/⭐-Stern-Toggle auf der Charakterkarte; `toggle-inspiration-stop` mit `stopPropagation` (öffnet nicht den Editor), plain `save()` ohne Undo
- ✓ Erweiterte Charakterwerte (CHAR-03): 18 Skills (Namen aus `SKILL_INFO`) + Expertise + freie Angriffsliste (Cap 20, Schadensformel-Whitelist) im Editor; Detail-Modal mit nach Attribut gruppierten Skills, klickbaren Saves/Attribut-Checks/Angriffen (Vorteil/Nachteil) → landen in der Würfel-Historie
- ✓ XP-/Milestone-Tracker (CHAR-01): „⭐ XP"-Trigger in der Initiative öffnet XP-Modal (CR-Auto-Summe via `getXPForCR` + immer verfügbare manuelle Korrektur), Gleichverteilung auf lebende Charaktere, Level-Aufstieg-HINWEIS ohne Auto-Bump (`pushUndo` vor Mutation), gruppenweiter `levelingMode`-Toggle (Milestone versteckt XP-UI, zeigt „+1 Level")
- ✓ Qualitätszyklus: Verifikation 13/13 must-haves, Build sauber (2.70 MB) + 421/421 Unit (inkl. 49 neue Advancement-Tests) + 13/13 Phase-6-E2E grün, Code-Review (1 Critical ist ein vorbestehender Dice-Tab-Bug außerhalb Phase 6; 6 Warnings dokumentiert in 06-REVIEW.md)
- Offen als UAT (06-HUMAN-UAT.md): 5 visuelle/UX-Checks (Stern-Styling, XP-Fortschrittsbalken, Skills-Gruppierung, Angriffs-Click-Affordance, XP-Modal-Live-Vorschau)

**Validated in Phase 5: Welt & Story (2026-06-18):**

- ✓ Session-Prep-Assistent: Szenenkarten, Checkliste, offene Fäden (WELT-Requirements, 8/8 Pläne inkl. Gap-Closure 05-08 NPC-Generator-Modal-Overlay)
- ✓ NPC-Generator: deutscher Name + Persönlichkeit + Marotte auf Knopfdruck, zentriertes Modal (UAT: Qualität + <1s-Latenz bestätigt)
- ✓ Harptos-Kalender: 12 Monate + 5 Festtage kanon-konform (UAT-geprüft), 1492 DR, Timeline-Verknüpfung
- ✓ Reise-Simulator: Tagesreisen, Jahreszeiten, Gelände; Fraktionen & Ruf-System (Ruf-Stufen, ±5/±10)
- ✓ Qualitätszyklus: 5/5 must-haves, 37 Unit + 24 E2E grün (E2E-Modulformat-Fix 687eb7d)

**Validated in Phase 7: Komfort & Analyse (2026-06-20):**

- ✓ Soundboard (UX-01): Audio-Bibliothek mit IDB-Blob-Persistenz (20/100-MB-Guards), Web-Audio-Szenen mit Layering + 2s-Crossfade, Alt+Shift+1..5-Quick-Slots; Session-Erweiterungen: Per-Track-Loop-Toggle mit Crossfade-Loop, Fortschrittsbalken, Live-Volume
- ✓ Würfel-Statistiken (UX-02): d20-Histogramm (inline-SVG) mit Erwartungs-Overlay, Crit-/Fumble-Quoten, Per-Character-Breakdown, Session/Gesamt-Filter; Roll-Capture via addToDiceHistory-Tee in eigenem IDB-Store
- ✓ Qualitätszyklus: Verifier 14/14, Audio-UAT 4/4 (dabei 3 Bugs gefunden+gefixt), Code-Review-Critical CR-01 behoben

**Shipped als Milestone v1.0 (2026-07-22)** — alle 31 v1-Requirements validiert, Archiv: `milestones/v1.0-REQUIREMENTS.md`.

**Validated in Phase 8: Test-Fundament grün (2026-07-23):**

- ✓ TEST-01: Alle 11 vorbestehenden E2E-Fails auf 0 — 3 App-Bugs gefixt (Action-Registry-Kollision `update-attr-mod`, renderAll()-Dispatch-Lücke, Migration-Banner-Überdeckung) + 7 Test-Bug-Cluster korrigiert (stale Selektoren, `D.timers`-Phantompfad, Onboarding-Toast-Race + zweite Boot-Zeit-`save()`-Race); jede Ursache in `docs/e2e-failure-triage.md` mit Fix-Commit dokumentiert
- ✓ TEST-02: Assertions gehärtet — 6 deterministische Zähl-Assertions auf `toBe(N)`, 17 begründete Ausnahmen kommentiert, 15 maskierende `isVisible()`-Guards konvertiert (dabei 2 weitere Test-Bugs gefunden+gefixt), 13 `waitForTimeout` durch Wait-Conditions ersetzt; neuer blockierender `e2e`-CI-Job in der Deploy-Kette
- ✓ Qualitätszyklus: Verifier 5/5 (Gap-Fix c4f6f6e: Tautologie-Assertion im Encounter-Undo-Test), Jest 457/457, Playwright 231 passed / 2 skipped / 0 failed, Code-Review 0 Critical (3 Warnings advisory in 08-REVIEW.md)

**Validated in Phase 9: Editor-Regressionsnetz & execCommand-Ablösung (2026-07-25):**

- ✓ EDIT-01: Alle 21 `document.execCommand`-Call-Sites in `ui/editors/rich-text.js` durch Selection/Range-DOM-Operationen ersetzt (7 Gruppen A–G über Pläne 09-06..09-09), Zählnachweis-Test verankert 0 Vorkommen
- ✓ EDIT-02: Beide Toolbars (statisch + floating) funktionieren unverändert — bewiesen durch 80-Tests-Regressionsnetz (4 Spec-Dateien) mit exakten Markup-Assertionen und Persistenz-Roundtrips; Baseline-Reparatur Option A (EDITOR_FONTS/TOOLBAR_DIMENSIONS + Font-Setter-Wiring) machte die floating Toolbar überhaupt erst wieder klickbar; Entwickler-Handcheck im Browser freigegeben
- ✓ EDIT-03: Regressionsnetz existierte VOR der Migration (D-04a-Doppel-Grün-Beweis in `09-BASELINE.md`, Netz-Freeze mit protokollierten Ausnahmen); Qualitätszyklus: Verifier 4/4, Playwright 308 passed / 2 skipped, Jest 457/457, Code-Review 2 Critical → CR-02 gefixt (`468bea1`), CR-01 als verhaltensneutrale Scope-Entscheidung dokumentiert

**Validated in v1.1 (Phasen 10–11, abgeschlossen 2026-07-27):**

- ✓ SEC-01/SEC-02 — Import-XSS geschlossen, Security-Audit (Phase 10)
- ✓ ARCH-01…ARCH-04 — Build-/Repo-Hygiene (Phase 11)
- Details im archivierten Milestone: `.planning/milestones/v1.1-REQUIREMENTS.md`

**Validated in Phase 12: Datensicherheit (2026-09-05):**

- ✓ SAFE-01: Der Umzugs-Export `file://` → PWA erfasst IndexedDB-Inhalte — Soundboard-Audio und
  Würfelstatistik reisen mit, Szenen spielen nach dem Import ihre Tracks, keine toten `blobId`s.
  Import- und Exportseite sind volumenbegrenzt (Einzelgrenze 100 MB, Gesamtbudget aus der
  Exportgrenze abgeleitet), und ein bereits geschriebener Import wird nie mehr als Fehlschlag
  gemeldet.
- ✓ SAFE-02: Das Datei-Backup deckt alle Kampagnen ab, kollidiert nicht bei Namen — und kann seine
  eigene gute Sicherung nicht mehr durch ein leeres Schema überschreiben (Inhaltsprüfung statt
  Schlüsselzahl); der aktive Zielname wird ehrlich aus dem Kampagnenindex aufgelöst.
- ✓ SAFE-03: Das Löschen einer Audiodatei ist rückgängig zu machen — Grabstein statt
  Sofortlöschung, Undo-Hook stellt Datei und Szenen-Referenz wieder her, bewiesen bis in eine echte
  Browser-Sitzung inklusive Reload.
- ✓ SAFE-04: Der Umzugs-Wizard bietet sich Nutzern mit Daten nicht mehr an — `isFreshInstall()`
  berücksichtigt `STORAGE_KEY_OVERRIDE`, den IDB-Pfad und alle Inhaltssammlungen; die
  Ausschlussliste ist als exportierte Konstante prüfbarer Quelltext mit Vollständigkeitstest.
- ✓ SAFE-05: Die Persistenz verhält sich bei Fehlern vorhersagbar — `undo()`/`redo()` serialisieren
  geschützt vor jeder Stack-Mutation, ein Fehlschlag lässt beide Stacks unberührt und meldet sich;
  der tote `autosave-toggle`-Pfad ist entfernt.
- ✓ SAFE-06: Die Persistenz-Randfälle sind getestet — >5-MB-IDB-only-Save mit Reload,
  localStorage-Quota-Fallback und Versions-Rundlauf laufen gegen den **echten** Produktivcode, nicht
  gegen Testnachbildungen.
- ✓ Qualitätszyklus: Verifikation `passed` 9/9 · UAT 28/28 · `12-SECURITY.md` `threats_open: 0`
  (72 Threats aus 17 Plan-Registern) · `12-VALIDATION.md` `nyquist_compliant: true` · Jest 908/908
  (31 Suites) · Playwright 321 passed / 2 skipped · `pytest tests/build` 24/24 · Code-Review
  CR-01/WR-01 behoben, IN-01 advisory offen

**Validated in Phase 13: Härtung & Wartbarkeit (2026-09-06):**

- ✓ SEC-03: `UIActions.call` ruft `window[ctx.value]` nur noch auf, wenn der Name in der
  130-Einträge-Allowlist `CALL_ACTION_WHITELIST` steht; das Verwerfen wird protokolliert.
- ✓ SEC-04: `parseWikiLinks()` escapt Attributwert **und** sichtbaren Textknoten über dieselbe
  `esc()`-Ausgabe; das doppelte `data-id` im Wiki-Baum ist weg.
- ✓ PERF-01: `utf8ByteLength()` ersetzt an beiden Save-Aufrufstellen die zweite `new Blob(...)`-
  Vollkopie; der Undo-Stack dedupliziert und deckelt mit Byte-Budget und Untergrenze. Die
  verbleibende Redundanz (`pushUndo()` serialisiert weiterhin die volle Kampagne) ist **gemessen
  statt vermutet** (0,922 ms Median) und als Verifikations-Override formal freigegeben.
- ✓ PERF-02: Der `diceStats`-IndexedDB-Store trägt einen harten Deckel (50.000 Datensätze,
  ältestes zuerst), eine abgesicherte Löschfunktion, und die Auswertung aggregiert per Cursor.
- ✓ MAINT-01: Vier Module mit 1500–1900 Zeilen in 14 Dateien aufgeteilt, alle ≤ 800 Zeilen
  (größte 673) — `dmscreen-render.js` abgesichert durch einen **vor** der ersten Verschiebung
  eingefrorenen 50-Snapshot-Charakterisierungstest, `rich-text.js` durch das Phase-9-Netz.
- ✓ MAINT-02: Die Tab-Registry löst Render-/Init-/Cleanup-Funktionen über verzögerte
  Funktionsreferenzen auf statt über `window[name]`-Strings.
- ✓ MAINT-03: Unterstrich-Emphase folgt der CommonMark-Wortgrenzenregel; `foo_bar_baz`-URLs
  bleiben unkorrumpiert.
- ✓ MAINT-04: `document.execCommand` ist auf **0** im gesamten Quellbaum — auch die drei in v1.1
  bewusst stehengelassenen Aufrufe außerhalb des Editor-Moduls sind abgelöst.
- ✓ MAINT-05: `initPerformanceMonitoring()` hat dieselbe Mehrfachstart-Guard wie
  `startAutoBackup()`; tote `mindmap`-Seeds und die `const D`-Überschattung sind entfernt.
- ✓ MAINT-06: Keine ungeguardete `console.*`-Ausgabe in Produktionspfaden mehr (89 → 24, alle
  vier verbleibenden Klassen sanktioniert und markiert).
- ✓ Qualitätszyklus: Verifikation `passed` 7/8 (ein vorab benannter, gemessener und formal
  freigegebener Override) · UAT 6/6 · `13-SECURITY.md` `threats_open: 0` (67 Bedrohungen) ·
  `13-VALIDATION.md` `nyquist_compliant: true`

**Validated in Phase 14: Tests & Gates (2026-09-07):**

- ✓ TEST-03: Die Toast-Race in den CRUD-E2E-Specs ist geschlossen — `seedCleanSession(page)` als
  einziger Seed-Helfer in allen fünf Specs, belegt durch einen **protokollierten roten Vorlauf**
  gegen den ungefixten Stand und zwei grüne Nachläufe bei zeichengleichen Lastparametern.
- ✓ TEST-04: Zwei 500+-zeilige Sammel-Testdateien in je fünf dedizierte Dateien zerlegt, Summen
  nachweislich unverändert (37 Unit, 26 E2E).
- ✓ TEST-05: `no-undef` auf `error` (Globals-Generator aus `loader.js MODULES` mit Drift-Wächter),
  Warnungsgrenze exakt auf den Reststand 367 gepinnt, strikter Typecheck über eine
  Zulassungsliste, `roots` repariert (Coverage misst wieder den Quellbaum), und ein
  Modul-zu-Test-Gate ersetzt die für diese Architektur bedeutungslose globale Schwelle.
- ✓ Qualitätszyklus: Verifikation `passed` 5/5 · UAT 1/1 · `14-SECURITY.md` `threats_open: 0`
  (32 Bedrohungen) · `14-VALIDATION.md` `validated` mit 9 datierten, bewusst offenen Restposten

**Shipped als Milestone v1.2 (2026-09-07)** — alle 19 Requirements validiert, Archiv:
`milestones/v1.2-REQUIREMENTS.md`, Audit: `milestones/v1.2-MILESTONE-AUDIT.md`.

### Active

_(v1.3 ist noch nicht aufgesetzt — der `DEBT`-Backlog ist leer. Übertrag siehe „Next Milestone: v1.3" oben.)_

- [ ] Gate-Ratschen mechanisieren statt sie als Prosa-Regel zu führen (NQ-03, NQ-06, NQ-07)
- [ ] `npm run check` grün bekommen — Prettier-Schuld abtragen, `format:check` in CI aufnehmen (NQ-09)
- [ ] Echte Tests für die sieben ausgenommenen Phase-13-Aufteilungsdateien (löst die MAINT-01/TEST-05-Spannung auf)
- [ ] `DEBT-01` fortsetzen: `tsconfig.strict.json`-Zulassungsliste über die 8 Dateien hinaus wachsen lassen

### Out of Scope

- Spieler-Ansicht (zweiter Bildschirm) — vom Nutzer bewusst abgewählt; `file://`-Origin-Isolation macht Fenster-Sync zusätzlich riskant
- Handout-System — vom Nutzer bewusst abgewählt
- Druck-Exporte (Spell-Cards, NPC-Karten) — vom Nutzer bewusst abgewählt
- Backend/Cloud-Server-Funktionen — App bleibt offline-first ohne Server
- Mindmap/Network-Reaktivierung — Feature wurde bewusst entfernt (Commit 7ef9bf5); nur Reste werden bereinigt
- Framework-Migration (React/Vue/ESM) — bewährte non-ESM-Architektur bleibt

## Context

- **Stand nach v1.2 (2026-09-07):** 134 JS-Module (nach den vier Aufteilungen in Phase 13), non-ESM Global-Scope-Architektur, `build.py` bündelt alles in eine standalone HTML-Datei (dev + `--production`). Suiten: Jest 1120 / Playwright 321 (2 skipped) / pytest 24. CI fährt Lint, beide Typechecks, Jest **mit Coverage-Schwelle**, Playwright, pytest und den Pages-Deploy.
- **Codebase-Map veraltet:** `.planning/codebase/` ist vom 2026-06-11 — also vor den Phasen 3–14 und damit vor den Modulaufteilungen. Vor größeren v1.3-Vorhaben per `/gsd-map-codebase` auffrischen (Achtung: der Mapper erfindet gelegentlich Zahlen — Kernzahlen gegen den Live-Code gegenprüfen).
- **Stand nach v1.0 (2026-07-22):** ~123 JS-Module (~81k Zeilen Quellcode), non-ESM Global-Scope-Architektur, `build.py` bündelt alles in eine standalone HTML-Datei (dev + `--production`). GitHub-Pages-Deploy via ci.yml (voll verifiziert: PWA-Install, SW-Update, Datei-Backup, Migrations-Wizard). Codebase-Map in `.planning/codebase/` (Stand 2026-06-11, vor Phasen 3–7 — bei Bedarf via `/gsd-map-codebase` auffrischen).
- **Nutzung:** Einzelnutzer (Entwickler = Spielleiter), Windows, Chromium-Browser; `file://`-Doppelklick UND installierte PWA. Deutsche UI durchgängig.
- **Wichtige Architektur-Lektion aus v1.0-UAT:** `window.save`-Monkey-Patches sind wirkungslos (globale `const`-Bindung überdeckt die window-Property) → expliziter `registerPostSaveHook`-Mechanismus in persistence.js (siehe CLAUDE.md „Live-Sync Pattern").
- **Die v1.0-Altlastenliste ist abgearbeitet:** Import-XSS (Phase 10), fehlende SECURITY.md (alle Phasen tragen jetzt eine, `threats_open: 0`), 11 E2E-Fails (Phase 8), `document.execCommand` 21 → **0** (Phasen 9 und 13). Offen bleibt allein `D.calendar.month` 0→1-Basis (benign).

## Constraints

- **Tech-Stack**: Pures JS/HTML/CSS, non-ESM, kein Framework, keine Runtime-Dependencies — bewährte Architektur, bleibt
- **Offline**: Muss ohne Server laufen; `file://`-Doppelklick ist der primäre Nutzungsmodus (PWA als strukturelle Verbesserung geplant)
- **Persistenz**: Nur LocalStorage + IndexedDB, kein Backend
- **Sprache**: Deutsche UI-Texte, Code-Kommentare gemischt DE/EN
- **Plattform**: Windows als primäre Dev-Umgebung (`PYTHONIOENCODING=utf-8`, `python` statt `python3`)
- **Build**: `build.py` ist das einzige Build-System. **`loader.js` ist die alleinige Modulliste** — `build.py` liest sie zur Buildzeit und bricht hart ab, wenn eine gelistete Datei fehlt (ARCH-01, Phase 11). Die früher hier geforderte Hand-Synchronität zweier Listen gibt es nicht mehr.

## Key Decisions

| Decision                                                                        | Rationale                                                                                                                      | Outcome   |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------- |
| Stabilisierung vor allen Features                                               | App startet aktuell nicht; Fundament zuerst                                                                                    | ✓ Good — stabile Basis trug alle 6 Folgephasen |
| Technik-Fundament als erste Feature-Gruppe (PWA, Datei-Backup, Command Palette) | Löst file://-Probleme strukturell und schützt Daten, bevor große Features kommen                                               | ✓ Good — PWA + Backup + Migration in UAT end-to-end bestätigt |
| Spieler-Ansicht/Handouts/Druck-Exporte ausgeklammert                            | Vom Nutzer im Brainstorming bewusst abgewählt                                                                                  | ✓ Good — nie vermisst, Fokus blieb scharf |
| Mindmap bleibt entfernt                                                         | Bereits entschieden (Commit 7ef9bf5, 2026-05-24); nur Reste bereinigen                                                         | ✓ Good |
| Tests grün ist kein hartes Stabilisierungs-Kriterium                            | Nutzer definiert „sauber" als: Konsole fehlerfrei, Build aktuell, Lint/Typecheck grün — Tests laufen mit, sind aber nicht Gate | ✓ Good — Suite wuchs organisch auf 453 grüne Tests |
| Sequenzielle Executor auf `main` statt Worktrees (ab Phase 5)                   | Windows-Stdio-Hänger + geteilte Dateien (view-html, CSS, actions) in fast jedem Plan                                            | ✓ Good — 0 Merge-Konflikte, stabile Läufe |
| Human-UAT als eigener Gate nach jeder Phase                                      | Automatisierte Checks decken Hörbares/Visuelles/Browser-only nicht ab                                                          | ✓ Good — UAT fand 8+ echte Bugs, die alle Test-Suiten verpassten |
| Datensicherheit zuerst, Gates zuletzt (v1.2-Reihenfolge)                        | `DEBT-18` bedeutet irreversiblen Verlust beim einmaligen Umzug; schärfere Gates auf einer gerade aufgeteilten Codebasis arbeiten gegen sich selbst | ✓ Good — die Reihenfolge hat gehalten; das Coverage-Gate traf am Ende die endgültige Modulstruktur |
| Charakterisierungs-Snapshot VOR der Aufteilung einfrieren (D-04, Phase 13)      | `dmscreen-render.js` (1576 Zeilen, 21 Widgets) hatte kein eigenes Testnetz — ohne Vorher-Beweis ist „verhaltensneutral" eine Behauptung | ✓ Good — 50 Snapshots zeichengleich vor und nach jeder Verschiebung; fing zugleich T-13-50 (verlorener `esc()`) ab |
| Roter Vorlauf als Pflicht für den Toast-Race-Beweis (D-02, Phase 14)            | Ein grüner Nachlauf allein beweist nichts, wenn der Lastlauf die Race vorher gar nicht reproduziert                              | ✓ Good — der Vorlauf war tatsächlich rot (5/95); ohne ihn wäre der Fix unbelegt geblieben |
| `MODULE_TEST_EXCEPTIONS` als datierte, sichtbare Ausnahmeliste statt globaler Schwelle | Eine globale Statement-Schwelle ist in einer non-ESM-Global-Scope-Architektur bedeutungslos                                | ⚠️ Revisit — ehrlicher als vorher, aber 7 der 8 Phase-13-Aufteilungsdateien landeten sofort auf der Liste |
| Milestone-Audit besteht auf Ausführungsnachweis, nicht auf SUMMARY-Behauptungen  | Zwei Phasen-Summaries behaupteten Dinge, die im Baum nicht zutrafen                                                            | ✓ Good — fand ein nie ausgeführtes Coverage-Gate und ein totes, ausgeliefertes Aktionsziel |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-09-07 nach Abschluss von Milestone v1.2 „Schulden-Abbau" (3 Phasen, 38 Pläne, 241 Commits, 122 Dateien +22.861/−6.265). Der `DEBT`-Backlog aus der v1.1-Triage ist leer: 26 Posten über 19 Requirements, alle validiert. Der Milestone-Audit bestand auf Ausführungsnachweisen statt SUMMARY-Behauptungen und fand dadurch zwei Dinge, die keine Phase gemeldet hatte — ein korrekt kalibriertes, aber nie ausgeführtes Coverage-Gate und ein totes Aktionsziel, das in beide Bundles ging. Beide geschlossen. Phase 13 bekam ihre nie gelaufene Sicherheits- und Validierungsprüfung retroaktiv (67 Bedrohungen, 16/16 Verifikationszeilen — null Lücken). Suiten: Jest 1120/1120, Playwright 321 passed / 2 skipped, pytest 24/24._
