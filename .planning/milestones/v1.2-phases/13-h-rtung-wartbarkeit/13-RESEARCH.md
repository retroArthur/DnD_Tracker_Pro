# Phase 13: Härtung & Wartbarkeit - Research

**Researched:** 2026-09-06
**Domain:** Vanilla-JS-Codebase-Härtung (Modulaufteilung, Persistenz-Last, IndexedDB-Store-Deckelung, XSS-Härtung, Editor-Migration, defensive Guards, Konsolen-Hygiene) — kein neues Framework, keine neue Laufzeit-Dependency
**Confidence:** HIGH — nahezu jede Einzelbehauptung dieses Dokuments wurde in dieser Sitzung gegen die Live-Datei gelesen und mit Zeilennummer belegt (siehe Tabellen unten); die einzigen `[ASSUMED]`-Stellen sind Vorschläge für Regex-Ersatz, die noch nicht existieren.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Modul-Aufteilung (MAINT-01)**
- D-01: Grenze ist 800 Zeilen, hart für jede Nachfolgedatei der vier Zieldateien. `core/srd-monsters.js` (7659 Zeilen) ausdrücklich nicht betroffen.
- D-02: Geschnitten wird entlang der vorhandenen Banner-Sektionen (`// ====`), nicht auf die Zeilenzahl hin. 800 ist Abnahme-, nicht Schnittkriterium.
- D-03: `ui/editors/rich-text.js` wird zuerst entflochten (zwei fremde Module: Zauberverwaltung ~615 Zeilen, Editor ~1300 Zeilen), nicht zerschnitten. Zielschnitt: Zauberverwaltung (~615) → Editor-Formatierung (~800) → Toolbars (~500).
- D-04: Kein Split ohne Regressionsnetz. `dmscreen-render.js` bekommt zuerst einen Charakterisierungstest (alle 21 Widget-Typen, HTML-Snapshot) — es hat faktisch keine eigene Testabdeckung (2 Dateien, 5 beiläufige Erwähnungen), im Gegensatz zur Roadmap-Annahme ist NICHT `rich-text.js` der riskante Fall.
- D-05: Reihenfolge nach steigendem Risiko: `wiki.js` → `initiative.js` → `rich-text.js` → `dmscreen-render.js`. Je ein eigener Plan, voller Suiten-Lauf als Hard-Gate vor jedem Commit.
- D-06: Registrierung neuer Module ausschließlich in `loader.js` `MODULES`-Array. `check_duplicate_functions()` bricht den Build vor dem Bündeln ab, falls eine Funktion beim Verschieben in der alten Datei stehen bleibt — das ist der gewünschte Ausgang.

**Undo- und Save-Last (PERF-01)**
- D-07: Save-Pfad wird zuerst entlastet, nicht Undo — von 76 (recherchiert: tatsächlich mehr, s. Korrektur unten) `saveUndoState()`/`pushUndo()`-Aufrufstellen liegt keine in einem heißen Pfad; `save()` ist debounced und läuft bei jeder Datenänderung.
- D-08: Im Save-Pfad entfällt `new Blob([dataString]).size` — Ersatz durch exakte UTF-8-Byte-Zahl per einmaligem String-Scan ohne zweite Allokation. `JSON.stringify(D)` bleibt.
- D-09: Undo-Semantik bleibt "ein Schritt stellt die volle Kampagne her". Entlastung über (a) Dedupe (identischer Snapshot wird nicht gepusht) und (b) Byte-Budget über den Stack zusätzlich zu `UNDO_LIMIT` (30).
- D-10: Kein Scoping einzelner Aufrufstellen, keine Delta-/Patch-Snapshots — würde impliziten Vertrag schaffen (Fehlerklasse von DEBT-17/DEBT-18) und scheitert an der Non-ESM/Runtime-Dependency-Sperre.
- **Konflikt mit Erfolgskriterium 2 — bewusst benannt:** Ein Undo-Snapshot serialisiert weiterhin die volle Kampagne. Der Plan MUSS an einer realen Kampagne messen (Dauer `JSON.stringify(D)`, Stringgröße, Stack-Gesamtgröße bei 30 Einträgen) und das Ergebnis vorlegen. Liegt die Serialisierung im einstelligen Millisekundenbereich, gilt Kriterium 2 als "für Save erfüllt, für Undo nachweislich unkritisch" — sonst ist D-10 mit Messwert neu zu bewerten.

**Würfelstatistik (PERF-02)**
- D-11: Deckel auf Datensatzzahl plus manueller Löschen-Knopf. Kein automatisches Pruning nach Alter/Session. Großzügiger Deckel (praktisch nie erreicht); verdrängt wird das Älteste zuerst. Löschen-Knopf braucht Rückfrage (one-way).
- D-12: `getAllStats()` bleibt für Export erhalten; Auswertung bekommt eigenen, cursor-/index-basierten Aggregat-Pfad. Nur `dice-stats-render.js` (heiß) wird umgebaut, `systems/migration/audio-export.js` (einmalig) behält Vollzugriff.

**Markdown-Wächter (MAINT-03)**
- D-13: `hasHtmlTags` wird entfernt (nie gelesen — Verdrahten würde Markdown-Anzeige praktisch überall abschalten, da der Rich-Text-Editor immer HTML speichert). Die eigentliche Ursache (Unterstrich-Emphase matcht wortintern) wird per CommonMark-Wortgrenzen-Regel behoben; `*`-Varianten bleiben unangetastet.

### Claude's Discretion (delegiert, nicht neu zu entscheiden)

- **D-14 (SEC-03):** Explizite Ziel-Whitelist als Konstante (nicht Namenspräfix-Konvention). Fehlerfall in `ui-actions.js:189` von `console.error` auf `ErrorHandler.log` hinter `DEBUG_MODE` (fällt sonst unter MAINT-06).
- **SEC-04:** `linkText` in `parseWikiLinks()` läuft durch `esc()`, nicht nur durch `"`-Ersetzen. Kommentar bei `wiki.js:432-434` wird entsprechend nachgezogen.
- **MAINT-02:** Nur die drei benannten Fundstellen (siehe Korrekturen unten). Die 169 Vorkommen von `const D = window.D` bleiben unangetastet (etabliertes Muster).
- **MAINT-04:** Phase-9-Hilfsfunktionen (`insertTextAtSelection()`, `wrapRangeWithElement()`) lösen die drei verbleibenden `execCommand`-Aufrufe ab. Die drei Treffer in `utils/basic.js` sind Kommentare und bleiben (Kriterium 6 verlangt nur Freiheit außerhalb von Kommentaren).
- **MAINT-05:** Tab-Registry-Renderer als Funktionsreferenzen statt Strings; `initPerformanceMonitoring()` bekommt denselben Guard wie `startAutoBackup()`.
- **MAINT-06:** 78 (recherchiert: 89 Live-Treffer, s. Korrektur) `console.*`-Aufrufe werden auf `ErrorHandler.log()` hinter `APP_CONFIG.DEBUG_MODE` umgestellt, nicht gelöscht. Kopfkommentare in `file-backup-manager.js` beschreiben künftig `registerPostSaveHook()`.

### Deferred Ideas (OUT OF SCOPE)

- `const D = window.D` projektweit umstellen (169 Vorkommen) — eigener mechanischer Refactoring-Posten, falls je gemacht.
- `encounter-calculator.js` (1292), `migration-wizard.js` (1105), `shops-core.js` (1073) aufteilen — über der 800er-Grenze, aber nicht in `MAINT-01` genannt.
- Dedizierte Widget-Testabdeckung über den Charakterisierungs-Snapshot hinaus (Phase 14, `TEST-04`).
- Undo-Scoping je Aufrufstelle — nur falls Messung aus dem PERF-01-Warnblock spürbare Last am Spieltisch zeigt.
- `console.*` per Build-Schritt strippen statt Quellcode-Guard — eigene Build-System-Änderung, passt besser zu Phase 14+.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-03 | `call`-Aktion (`ui/actions/ui-actions.js:186-190`) ruft nur noch Whitelist-Ziele auf | Verifiziert: exakter Code, 131 statische `data-value`-Ziele bei `data-action="call"` im gesamten Baum, keine dynamischen (`${...}`) Ziele gefunden — Whitelist ist vollständig grep-bar. Siehe Architecture Patterns → "Whitelist statt Konvention". |
| SEC-04 | Regex-Capture in `parseWikiLinks()` escapt | Verifiziert: `wiki.js:648-654`, sicherheitskritischer Kommentar bei `:432-434`. Siehe Code Examples. |
| PERF-01 | Undo-Snapshots/Saves serialisieren nicht mehr bei jeder Operation die volle Kampagne | Verifiziert: `persistence.js:42` (`saveImmediate`) und `:205` (`save`) beide mit `new Blob([...]).size`; `undo.js` UNDO_LIMIT=30, volle Serialisierung pro Push. **Korrektur zu D-07:** `initiative.js` ruft `pushUndo` doch zweimal auf (Zeilen 374, 1565) — s. Common Pitfalls. |
| PERF-02 | Würfelstatistik-Store: Prune/Löschen, kein Vollladen bei Auswertung | Verifiziert: `features/dice-stats/dice-stats-idb.js` hat nur `statsIdbPut`/`getAllStats`/`getStatsForSession` — kein Prune, kein Delete. Hot Consumer bei `dice-stats-render.js:233`; zweiter Consumer `audio-export.js:202,229`. |
| MAINT-01 | Vier übergroße Module aufgeteilt, Verhalten unverändert | Verifiziert: alle vier Dateien, alle Sektionsgrenzen, alle Zeilenzahlen (1932/1655/1576/1217). Konkreter Schnittvorschlag je Datei unten. |
| MAINT-02 | Irreführende/tote Codestellen beseitigt | Verifiziert, mit einer Zeilen-Korrektur (`soundboard-player.js:145` statt `:147`) — s. Common Pitfalls. |
| MAINT-03 | `hasHtmlTags`-Wächter verdrahtet/entfernt, Unterstrich-URL-Bug behoben | Verifiziert: `markdown-converter.js:264,271,275`; CommonMark-Regel recherchiert und zitiert. |
| MAINT-04 | Letzte 3 `execCommand`-Aufrufe abgelöst | Verifiziert: exakte Zeilen `entity-links.js:87`, `wiki.js:831`, `system-actions.js:82`; Kommentare in `utils/basic.js:125,126,235` bleiben (kein Aufruf). |
| MAINT-05 | Tab-Registry und `initPerformanceMonitoring()` gegen Umbenennung/Mehrfachstart abgesichert | Verifiziert: `tab-registry.js` `renders: ['renderX']`-Muster; `backups.js:306-308` (Guard vorhanden) vs. `:321-330` (kein Guard). |
| MAINT-06 | Konsole in Produktionspfaden still, Kopfkommentare korrekt | Verifiziert: 89 `console.*`-Treffer im Quellbaum (nicht 78, s. Korrektur). `no-console` ist im ESLint-Config `'off'` gestellt (`eslint.config.js:103`) — Lint erzwingt nichts. **Korrektur:** die zweite irreführende Kopfkommentar-Stelle liegt bei `file-backup-manager.js:674`, nicht `:387` wie in CONTEXT.md zitiert. |
</phase_requirements>

## Summary

Phase 13 ist eine reine Codebasis-Härtungsphase ohne neue Laufzeit-Dependencies, kein neues Framework
und keine externen Bibliotheken — die Recherche bestand daher fast ausschließlich aus dem Gegenlesen
der `13-CONTEXT.md`-Behauptungen gegen den Live-Quellcode. Das Ergebnis: **die überwältigende Mehrheit
der Zeilen- und Zahlenangaben aus `13-CONTEXT.md` ist exakt korrekt** — insbesondere alle Sektionsgrenzen
der vier zu splittenden Dateien, alle Zeilenzahlen der zum Vergleich herangezogenen Nachbardateien
(`encounter-calculator.js` 1292, `migration-wizard.js` 1105, `shops-core.js` 1073, `dice-core.js` 807,
`random-tables.js` 749, `srd-monsters.js` 7659), sowie jede einzelne der zitierten Zeilen für SEC-03,
SEC-04, PERF-02, MAINT-03 und MAINT-04.

Drei Korrekturen wurden gefunden und müssen in die Planung einfließen:

1. **PERF-01/D-07:** `features/initiative.js` ruft `pushUndo()` entgegen der Behauptung "ruft es gar
   nicht" tatsächlich zweimal auf (Zeile 374: XP-Verteilung, Zeile 1565: Beute entfernen). Das ändert
   die Kernaussage von D-07 nicht (beide Aufrufe sind menschlich getaktete Einzelaktionen, keine
   Schleife — die Schlussfolgerung "Save ist der heiße Pfad" bleibt tragfähig), aber der Plan darf
   nicht mit der falschen Tatsachenbehauptung "initiative.js hat keine Undo-Aufrufe" argumentieren.
2. **MAINT-02:** Die `const D`-Überschattung in `soundboard-player.js` liegt auf Zeile **145**, nicht
   **147** wie in `13-CONTEXT.md` behauptet (die dort erwähnte "Roadmap nennt 145" war die korrekte Zahl).
3. **MAINT-06:** Der zweite irreführende `window.save`-Kopfkommentar in
   `systems/file-backup/file-backup-manager.js` liegt auf Zeile **674** ("Haengt sich einmalig in
   window.save() ein"), nicht Zeile **387** wie zitiert (dort steht eine unabhängige JSDoc für
   `pruneOldSnapshots`, ohne Bezug zu Save-Hooks). Zeile 6 ist korrekt.

Zusätzlich: die Zählungen "76 Aufrufstellen" (Undo) und "78 `console.*`-Aufrufe" sind ungefähr, nicht
exakt — Live-Grep findet 87 Treffer über 38 Dateien für `saveUndoState()`/`pushUndo(` (inkl. 2 Testdateien
und `tools/debug.js`) bzw. 89 Treffer für `console\.(log|error|warn|info|debug)` im Quellbaum (exkl.
`tests/`, `dist/`). Der Plan sollte die exakte Liste zur Ausführungszeit neu grep-en statt sich auf die
zitierten Zahlen zu verlassen — sie sind nah genug, um die Entscheidung zu tragen, aber nicht bit-genau.

**Primary recommendation:** Jede der zehn Requirements ist unabhängig planbar und hat bereits eine
vollständig verifizierte Zeilen-Landkarte in diesem Dokument. Reihenfolge innerhalb des Phasen-Plans:
Modul-Aufteilung (`MAINT-01`, vier eigene Pläne in der Reihenfolge D-05) zuerst grob parallelisierbar zu
den kleineren, unabhängigen Fixes (SEC-03/04, PERF-02, MAINT-03/04/05/06) — nur `PERF-01` sollte nach
`MAINT-01` geplant werden, da beide dieselben Persistenz-Dateien anfassen (siehe ROADMAP-Abhängigkeit
zu Phase 12/`SAFE-05`, hier analog für phaseninterne Reihenfolge).

## Architectural Responsibility Map

Diese App hat **keine Server-/API-/CDN-Tier** — reine Client-Anwendung, `file://`-fähig, Persistenz in
`localStorage` + `IndexedDB` (CLAUDE.md: "runs entirely offline in browser"). Alle zehn Requirements
liegen daher in genau zwei Tiers:

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Modul-Aufteilung (MAINT-01) | Browser/Client | — | Reine Code-Organisation, kein Datenfluss betroffen |
| Undo/Save-Last (PERF-01) | Browser/Client | Storage (localStorage/IndexedDB) | Serialisierung läuft im Client-JS, Ziel ist Storage |
| Würfelstatistik-Deckel (PERF-02) | Storage (IndexedDB) | Browser/Client (Render) | Store-Wachstum ist ein Storage-Problem; Aggregation läuft im Client |
| `call`-Whitelist (SEC-03) | Browser/Client | — | Event-Delegation, DOM-Ebene |
| Wiki-Link-Escaping (SEC-04) | Browser/Client | — | Render-Pipeline |
| Markdown-Wächter (MAINT-03) | Browser/Client | — | Anzeige-Konvertierung |
| execCommand-Ablösung (MAINT-04) | Browser/Client | — | Editor-DOM |
| Tab-Registry/Perf-Guard (MAINT-05) | Browser/Client | — | Navigation/Lifecycle |
| Konsolen-Hygiene (MAINT-06) | Browser/Client | — | Cross-Cutting, alle Layer |

## Standard Stack

**Keine neuen Abhängigkeiten.** Dieses Projekt ist bewusst Non-ESM, kein Framework, keine
Runtime-Dependency (CLAUDE.md, mehrfach bestätigt in Phase-12/13-Kontext). Alle zehn Requirements
werden mit vorhandenen Sprachmitteln (Vanilla JS, DOM APIs, IndexedDB) gelöst.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|---------------|
| — | — | — | Keine neue Bibliothek nötig; siehe Don't Hand-Roll für wiederverwendbare interne Muster |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled Markdown-Regex-Konverter (MAINT-03) | `marked`/`markdown-it` (npm) | **Verworfen** — nicht in `package.json` vorhanden `[VERIFIED: package.json]`, würde die Non-ESM/No-Runtime-Dependency-Architektur brechen; Fix ist eine 2-Zeilen-Regex-Änderung, kein Konverter-Austausch (D-13) |
| `fake-indexeddb` (npm) für PERF-02-Tests | Handgerollter IDB-Mock (`createMockIDB`, `soundboard.test.js:150`) | **Verworfen** — nicht in `package.json`; das Projekt hat bereits zweimal (`stability.test.js`, `soundboard.test.js`) einen funktionierenden handgerollten Mock etabliert, ein drittes Mal denselben Stil verwenden statt neue Dependency einführen |

**Installation:** Keine — Requirement betrifft ausschließlich vorhandenen Code.

## Package Legitimacy Audit

**Nicht anwendbar.** Diese Phase installiert keine externen Pakete (siehe Standard Stack). Der
`package.json`-Stand wurde gelesen und enthält keine neuen `dependencies`/`devDependencies`-Kandidaten
für die zehn Requirements `[VERIFIED: package.json]`.

## Architecture Patterns

### System Architecture Diagram

```
Nutzer-Interaktion (Klick, Tastatur)
        │
        ▼
EventDelegation (ui/event-delegation.js)
  liest target.dataset.value → ctx.value
        │
        ▼
ACTIONS-Map (ui/actions/*.js)
  z.B. 'call': ctx => window[ctx.value](ctx.id)   ← SEC-03: heute ungefiltert
        │                                            → Ziel: gegen CALL_ACTION_WHITELIST prüfen
        ▼
Feature-Funktion (z.B. saveCharacter, deleteNPC)
        │
        ├─→ saveUndoState()/pushUndo() ─→ JSON.stringify(window.D) ─→ undoStack[] (Cap 30, PERF-01)
        │                                    (voll bei JEDER destruktiven Op)
        │
        └─→ window.save() (debounced) ─→ persistence.js: JSON.stringify(D)
                                              → new Blob([...]).size (PERF-01, 2× redundant)
                                              → localStorage ODER IndexedDB-Fallback (>5MB)
                                              → _notifyPostSaveHooks() ─→ registrierte Hooks
                                                   (file-backup, DM-Screen Live-Sync, …)

Separat: Wuerfelwurf ─→ statsIdbPut() ─→ IndexedDB "diceStats"-Store (PERF-02: unbegrenzt wachsend)
         Auswertung öffnen ─→ getAllStats() (heiß, Vollladen) ─→ dice-stats-render.js:233
         Migrations-Export ─→ getAllStats() (einmalig, Vollzugriff bleibt) ─→ audio-export.js:202,229

Wiki-Rendering: entry.content ─→ renderMarkdownInContent() (sanitizeHTML() zuerst!)
                              ─→ parseWikiLinks() (SEC-04: linkText heute nur "-escaped)
                              ─→ addTOCAnchors() ─→ DOM
```

### Recommended Project Structure (MAINT-01 Zielschnitt)

Alle vier Dateien tragen bereits `// ====`-Sektionsbanner; D-02 verlangt, entlang dieser Grenzen zu
schneiden. Verifizierte Sektionsgrößen (Zeile → Zeile, Länge):

**`ui/editors/rich-text.js` (1932 Zeilen gesamt `[VERIFIED: wc -l]`) — Ziel: 3 Dateien**
| Sektion | Zeilen | Länge | Zielort |
|---------|--------|-------|---------|
| STATE | 6–21 | 16 | Zauberverwaltung |
| RENDER | 22–277 | 256 | Zauberverwaltung |
| SPELL FORM | 278–321 | 44 | Zauberverwaltung |
| EDITOR FORMATTING | 322–1120 | 799 | Editor-Formatierung |
| FLOATING TOOLBAR | 1121–1471 | 351 | Toolbars |
| CONTEXT TOOLBARS | 1472–1624 | 153 | Toolbars |
| SPELL CRUD | 1625–1904 | 280 | Zauberverwaltung |
| EXPORTS | 1905–1932 | 28 | je nach Ziel aufteilen |

Zauberverwaltung-Summe (STATE+RENDER+SPELL FORM+SPELL CRUD) = 596 Zeilen — deckt sich mit D-03s "~615"
(Differenz durch grob gerundete Bannerzeilen, `[VERIFIED: ui/editors/rich-text.js` Section-Banner-Greps
dieser Sitzung`]`). Editor-Formatierung allein = 799 Zeilen, **1 Zeile unter der 800er-Grenze** — bereits
maximal ausgenutzt, keinerlei Puffer für neue Zeilen während der Extraktion. Toolbars zusammen = 504
Zeilen.

**`features/dmscreen/dmscreen-render.js` (1576 Zeilen gesamt) — Achtung: größte Einzelsektion aller
vier Dateien**
| Sektion | Zeilen | Länge |
|---------|--------|-------|
| CONSTANTS | 5–92 | 88 |
| LIVE-SYNC SYSTEM | 93–193 | 101 |
| LAYOUT PROFILES | 194–426 | 233 |
| WIDGET CONFIGURATION | 427–505 | 79 |
| DRAG & DROP (Grid) | 506–577 | 72 |
| DRAG & DROP (Config-Liste) | 578–637 | 60 |
| WIDGET DEFINITIONS (Registry, `getDMScreenWidgets()`) | 638–782 | 145 |
| PARTY/INITIATIVE/DICE/DC/TABLES/RULES/NOTES WIDGET (7 Basis-Widgets) | 783–1031 | 249 |
| **NEUE REFERENZ-WIDGETS (13 Widget-Renderer)** | **1032–1454** | **423** |
| EVENT HANDLERS | 1455–1548 | 94 |
| KEYBOARD SHORTCUTS | 1549–1572 | 24 |
| BACKWARD COMPATIBILITY | 1573–1576 | 4 |

Die Sektion "NEUE REFERENZ-WIDGETS" (423 Zeilen, 13 Renderfunktionen für Aktionen/Attribute/
Rettungswürfe/Fertigkeiten/Kampfökonomie/Größen/Objekte/Improvisierte Waffen/Ritual & Konzentration/
Schadensarten/Terrain/Wissensgebiete/Reisen & Traglast — siehe CLAUDE.md "DM Screen" Abschnitt für die
Liste) ist selbst über 400 Zeilen und muss laut D-02 ("keine Ausnahme von D-01") entlang von
Unter-Verantwortlichkeiten weiter geteilt werden — z. B. nach den 13 Einzelwidgets in 2-3 Gruppendateien
(Kampfbezogen: Aktionen/Kampfökonomie/Schadensarten/Terrain; Charakterbezogen: Attribute/Rettungswürfe/
Fertigkeiten/Wissensgebiete; Umgebung/Sonstiges: Größen/Objekte/Improvisiert/Ritual/Reisen). Insgesamt
mindestens 3-4 Zieldateien für `dmscreen-render.js`, nicht die 2-3 wie bei `rich-text.js` — die Datei ist
strukturell breiter (21 unabhängige Widget-Renderer statt 2 Verantwortlichkeiten).

**`features/initiative.js` (1655 Zeilen gesamt)**
| Sektion | Zeilen | Länge |
|---------|--------|-------|
| UTILITY FUNCTIONS | 7–22 | 16 |
| RENDER HELPER FUNCTIONS | 23–253 | 231 |
| XP-VERTEILUNG | 254–401 | 148 |
| (unbenannter Block: HP/AC/Init-Bearbeitung) | 404–559 | 156 |
| EFFECTS | 560–659 | 100 |
| DEATH SAVES TRACKER | 660–751 | 92 |
| LEGENDÄRE AKTIONEN + WIDERSTÄNDE | 752–836 | 85 |
| CONCENTRATION TRACKER | 837–1005 | 169 |
| AOE DAMAGE CALCULATOR | 1006–1205 | 200 |
| **LOOT SYSTEM (Master-Detail)** | **1206–1578** | **373** |
| BATTLEFIELD CONDITIONS | 1579–1619 | 41 |
| GLOBAL EXPORTS | 1620–1655 | 36 |

"LOOT SYSTEM" (373 Zeilen) ist unter 800 und muss laut D-01 nicht weiter geteilt werden, ist aber mit
Abstand die größte Einzelsektion — guter Kandidat für eine eigene Datei
(`features/initiative/loot-system.js` o. ä.), während die übrigen kleinen Sektionen (EFFECTS,
DEATH SAVES, LEGENDARY, CONCENTRATION, AOE — zusammen 646 Zeilen) sich zu einer "Combat-Widgets"-Datei
unter 800 bündeln lassen.

**`features/wiki/wiki.js` (1217 Zeilen gesamt — kleiner als in `13-CONTEXT.md`/`REQUIREMENTS.md`
implizit angenommen; beide Dokumente geben KEINE Zeilenzahl für `wiki.js` an, nur für die anderen drei)**
| Sektion | Zeilen | Länge |
|---------|--------|-------|
| STATE | 6–19 | 14 |
| CONSTANTS | 20–209 | 190 |
| RENDER | 210–548 | 339 |
| WIKI CRUD | 549–834 | 286 |
| WIKI UX IMPROVEMENTS | 835–1187 | 353 |
| EXPORTS | 1188–1217 | 30 |

Alle sechs Sektionen liegen bereits unter 800 — `wiki.js` braucht rein rechnerisch nur 2 Zieldateien
(z. B. STATE+CONSTANTS+RENDER als "wiki-render.js" [543 Zeilen], WIKI CRUD+WIKI UX+EXPORTS als
"wiki-crud.js" [669 Zeilen]), was zu D-05s Einstufung als risikoärmster erster Split passt (kleinste
Datei, einfachste Schnittkante, 14 Testdateien erwähnen sie bereits).

### Pattern 1: Post-Save-Hook statt `window.save`-Wrapping (bereits etabliert, MAINT-06 nutzt es)

**What:** Konsumenten registrieren sich über `registerPostSaveHook(fn)`; die Persistenzschicht ruft
alle Hooks nach jedem erfolgreichen Schreibvorgang auf.
**When to use:** Jede Stelle, die auf "Daten wurden gespeichert" reagieren muss (Live-Sync, Datei-Backup).
**Example (bereits produktiv, korrekt implementiert):**
```javascript
// Source: systems/spellslots/persistence.js:14-18 (VERIFIED, read this session)
function registerPostSaveHook(fn) {
    if (typeof fn !== 'function') return;
    if (!Array.isArray(window._postSaveHooks)) window._postSaveHooks = [];
    if (!window._postSaveHooks.includes(fn)) window._postSaveHooks.push(fn);
}
```
Der Konsument in `file-backup-manager.js` nutzt es bereits korrekt (`:685-686`,
`window.registerPostSaveHook(onAfterSave)`) — nur die Kopfkommentare (`:6`, `:674`) beschreiben noch das
alte, falsche `window.save`-Wrapping-Muster.

### Pattern 2: Whitelist statt Namenspräfix-Konvention (SEC-03, D-14)

**What:** `call`-Aktion ruft `window[ctx.value]` nur, wenn `ctx.value` in einer expliziten Konstante steht.
**Warum diese Wahl belegt ist:** Live-Grep über den gesamten Baum findet 131 unterschiedliche statische
`data-value`-Ziele bei `data-action="call"`, verteilt über Templates und JS-generierte HTML-Strings — und
**null** dynamisch mit Template-Literal gebaute Ziele (`data-value="${...}"` kam bei keinem Treffer neben
`data-action="call"` vor) `[VERIFIED: ripgrep über *.js/*.html dieser Sitzung]`. Das heißt: eine
vollständige Whitelist ist mechanisch aus dem Quellbaum ableitbar — kein Ziel entsteht zur Laufzeit aus
Nutzerdaten.
```javascript
// Aktuell (SEC-03-Fund), Source: ui/actions/ui-actions.js:186-190 (VERIFIED, read this session)
call: ctx => {
    const fn = window[ctx.value];
    if (typeof fn === 'function') fn(ctx.id);
    else console.error('[EventDelegation] Function not found:', ctx.value);
},
```
Fix-Muster: `CALL_ACTION_WHITELIST = new Set([...131 grep-ermittelte Namen...])`, Prüfung vor dem Aufruf,
Fehlerpfad auf `ErrorHandler.log` hinter `DEBUG_MODE` umgestellt (D-14 zweiter Teil).
**Empfehlung an den Planer:** Die Whitelist zur Ausführungszeit frisch grep-en (Pattern:
`data-action="call"[^>]*data-value="([^"]+)"`, auch umgekehrte Attributreihenfolge prüfen) statt die 131
hier gelisteten Namen hart zu kopieren — neue `call`-Ziele können zwischen Recherche und Ausführung
hinzukommen.

### Pattern 3: Wortgrenzen-Regel für Emphase (MAINT-03, D-13)

**What:** CommonMark verbietet Unterstrich-Emphase, wenn unmittelbar ein alphanumerisches Zeichen
angrenzt — `*`-Emphase hat diese Einschränkung nicht.
**Belegt (CommonMark-Spezifikation, zitiert über offizielle Diskussion des Specs):** "the underscore
variant ... cannot open strong emphasis if it is preceded by a Unicode alphanumeric character, and it
cannot close if it is followed by one. This is why many implementations have restricted intraword
emphasis to the `*` forms" `[CITED: commonmark-spec / johnmacfarlane.net, via Recherche dieser Sitzung]`.
**Aktueller Fehler, exakt reproduziert:**
```javascript
// Source: ui/editors/markdown-converter.js:271,274-275 (VERIFIED, read this session)
result = result.replace(/__([^_]+)__/g, '<b>$1</b>');               // Zeile 271 — kein Wortgrenzen-Schutz
result = result.replace(/(?<!_)_([^_]+)_(?!_)/g, '<i>$1</i>');      // Zeile 275 — Schutz nur gegen "__", nicht gegen Wortinnenlage
```
Test: `https://example.com/foo_bar_baz` — Zeile 275 matcht `_bar_` (davor "o", danach "b", beides kein
`_`, also erlaubt der bestehende Lookaround den Treffer) → Ergebnis `foo<i>bar</i>baz`, URL kaputt.
Ein Wortgrenzen-Lookaround (`(?<![\w])` / `(?![\w])` statt nur `(?<!_)` / `(?!_)`) verhindert das, da vor
`_bar_` ein alphanumerisches "o" steht. **`hasHtmlTags` (Zeile 264, `/<[^>]+>/.test(html)`) wird laut D-13
ersatzlos entfernt**, nicht verdrahtet — verifiziert: die Variable wird berechnet, aber nirgends im Rest
der Funktion gelesen `[VERIFIED: markdown-converter.js:258-290, read this session]`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB-Mock für PERF-02-Unit-Tests | `fake-indexeddb`-Paket oder eigenes neues Mock-Framework | `createMockIDB(seedRecords)`-Muster (`tests/unit/soundboard.test.js:150`) bzw. das `idbInstance`-Objekt-Muster (`tests/unit/stability.test.js:449,1830`) | Beide Muster existieren bereits, sind erprobt und decken genau den Fall "IndexedDB-Store mit Records" ab — ein drittes, inkonsistentes Mock würde Wartungslast erhöhen |
| Byte-Größe eines Strings ohne zweite Allokation (PERF-01/D-08) | Eigene Blob-Alternative mit `TextEncoder().encode(str).length` (allokiert ebenfalls ein neues Array) | Einmaliger Scan über den String mit UTF-8-Byte-Zählung pro Codepoint (kein Zwischenobjekt) | `TextEncoder` alloziert intern ebenfalls eine komplette Kopie — löst das Speicherproblem nicht wirklich, nur die Blob-Konstruktion. Ein manueller Scan (Codepoint-Iteration, UTF-8-Byte-Regeln) ist die einzige Variante ganz ohne zweite Vollkopie. |
| Whitelist-Wächter für `call`-Aktion (SEC-03) | Eigenes Berechtigungssystem / Rollen-Konzept | Einfache `Set`/Array-Konstante + `.has()`-Check vor `window[ctx.value]` | Es gibt exakt eine Aktion (`call`) mit diesem Risiko und 131 bekannte, statische Ziele — ein Regelwerk wäre Overengineering für ein Einzelnutzer-Offline-Tool |
| Undo-Dedupe (D-09) | Deep-Equal-Bibliothek für Objektvergleich | String-Vergleich der bereits vorhandenen `JSON.stringify(D)`-Ausgabe gegen `undoStack[undoStack.length-1].state` | Der String wird für den Push ohnehin gebraucht (`pushUndo()` serialisiert bereits, `undo.js:17`) — ein Stringvergleich ist O(n) und braucht keine Bibliothek |

**Key insight:** Für dieses Projekt (Non-ESM, keine Runtime-Dependency, Einzelnutzer-Offline-App) ist die
richtige Antwort auf "Don't Hand-Roll" in dieser Phase fast immer "wiederverwende das bereits im Projekt
etablierte handgerollte Muster", nicht "hole eine npm-Bibliothek" — letzteres würde die Architektur-Grenze
verletzen, die CLAUDE.md und `13-CONTEXT.md` (D-10: "Delta-Snapshots scheiden an der
Runtime-Dependency-Sperre aus") ausdrücklich ziehen.

## Runtime State Inventory

**Trigger-Einschätzung:** MAINT-01 ist ein Datei-Split (Code-Reorganisation), keine Umbenennung eines
Strings/Schlüssels, der in Laufzeit-Zustand referenziert wird — die Funktionen behalten ihre Namen,
ändern nur ihre Datei. Trotzdem wurde die Kategorie-Liste geprüft, da PERF-02 einen IndexedDB-Store
verändert:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `diceStats`-IndexedDB-Store (PERF-02) bekommt einen neuen Deckel — bestehende Datensätze bleiben erhalten, nur künftiges Wachstum wird begrenzt. Kein Schema-Wechsel, kein Migrations-Schritt nötig (`[VERIFIED: dice-stats-idb.js liest keine Versionsnummer/Migrationslogik]`). | Code-Edit (Cap-Check vor `store.add()`), keine Datenmigration |
| Live service config | Keine — diese App hat keine externen Dienste (kein Server, kein SaaS). | Keine |
| OS-registered state | Keine — reine Browser-Anwendung, keine OS-Registrierungen (kein Task Scheduler, kein pm2). | Keine |
| Secrets/env vars | Keine — kein `.env`, keine Secrets im gesamten Projekt (Offline-Client-App). | Keine |
| Build artifacts | `loader.js`s `MODULES`-Array muss bei jedem Datei-Split um die neuen Pfade erweitert werden (D-06); `build.py` bricht sonst ab, weil eine im alten Pfad gesuchte Datei fehlt bzw. eine im neuen Pfad erzeugte Funktion doppelt vorkommt (`check_duplicate_functions()`). Kein separates Build-Artefakt (kein `.egg-info` o. ä. in diesem Node/Python-Hybrid-Projekt) bleibt stehen — `dist/*.html` wird bei jedem `build.py`-Lauf komplett neu geschrieben. | Code-Edit (`loader.js` MODULES-Array), kein Datenmigrationsschritt |

**Nichts gefunden in:** Live service config, OS-registered state, Secrets/env vars — verifiziert durch
Projektarchitektur (offline, kein Server, kein OS-Hook, `.gitignore`/Projektstruktur ohne `.env`-Datei).

## Common Pitfalls

### Pitfall 1: Zitierte Zeilennummern in Kontext-/Anforderungsdokumenten können veraltet sein
**What goes wrong:** `13-CONTEXT.md` und `REQUIREMENTS.md` zitieren `soundboard-player.js:147` für die
`const D`-Überschattung; der tatsächliche Fundort ist Zeile **145** `[VERIFIED: grep + Read dieser
Sitzung]`. Ebenso zitiert `13-CONTEXT.md` `file-backup-manager.js:387` als zweite Stelle mit
irreführendem Kopfkommentar — die tatsächliche zweite Stelle ist Zeile **674**; Zeile 387 gehört zu einer
unabhängigen JSDoc für `pruneOldSnapshots()` ohne jeden Bezug zu Save-Hooks.
**Why it happens:** Zeilennummern verschieben sich zwischen dem Zeitpunkt der Triage (Phase 11) und der
Phase-13-Planung durch zwischenzeitliche Commits in Phase 12.
**How to avoid:** Der Planer sollte jede zitierte Zeile mit einem frischen `grep -n` gegenprüfen, bevor
er sie in eine Task-Beschreibung übernimmt — genau wie in dieser Recherche geschehen.
**Warning signs:** Ein `Read` an der zitierten Zeile zeigt Code, der nicht zur Beschreibung passt.

### Pitfall 2: "Ruft es nie auf" ist eine gefährliche Verallgemeinerung ohne Vollgrep
**What goes wrong:** D-07 behauptet, `features/initiative.js` rufe `saveUndoState()`/`pushUndo()`
"gar nicht" auf. Ein Vollgrep findet zwei Aufrufstellen (`:374`, `:1565`).
**Why it happens:** Die ursprüngliche Analyse hat vermutlich nach `saveUndoState()` allein gesucht (das
in `initiative.js` tatsächlich nicht vorkommt) und `pushUndo(` als Alias übersehen, oder umgekehrt.
**How to avoid:** Bei einem "ruft nie/nirgends auf"-Befund immer BEIDE Namensformen greppen — dieses
Projekt hat mit `saveUndoState()` und `pushUndo()` zwei Namen für denselben Effekt (`saveUndoState()` ist
laut `undo.js:41-43` nur ein Alias: `function saveUndoState(action = 'Änderung') { pushUndo(action); }`).
**Warning signs:** Eine Aussage "Datei X ruft Funktion Y nie auf" ohne begleitenden Grep-Beleg im
Kontext-Dokument.

### Pitfall 3: 800-Zeilen-Grenze lässt bei `rich-text.js`s Editor-Formatierung keinen Puffer
**What goes wrong:** Die Sektion EDITOR FORMATTING (Zeilen 322–1120) ist exakt 799 Zeilen lang — nur
eine Zeile unter der 800er-Grenze aus D-01. Jede zusätzliche Zeile während der Extraktion (z. B. ein
neuer Kommentar, eine Leerzeile für Lesbarkeit, ein `window.xyz = ...`-Export am Dateiende) reißt die
Grenze.
**Why it happens:** Die Grenze wurde nach den *bestehenden* Sektionsgrößen kalibriert (D-01s eigene
Begründung), nicht mit Sicherheitsabstand.
**How to avoid:** Der Plan für den `rich-text.js`-Split (dritter in D-05s Reihenfolge) sollte diese
Sektion vorab auf eine Untergliederung prüfen (z. B. Selection/Range-Hilfsfunktionen vs. Toolbar-Font/
Highlight-Logik als zwei separate Dateien), statt sie 1:1 in eine neue Datei zu kopieren.
**Warning signs:** `wc -l` der neuen Datei nach der Extraktion zeigt ≥800.

### Pitfall 4: `check_duplicate_functions()` ist der Sicherheitsnetz, nicht das Problem
**What goes wrong (bereits von CLAUDE.md dokumentiert, hier bestätigt relevant):** Beim Verschieben
einer Funktion aus einer der vier Zieldateien in eine neue Datei bleibt sie leicht auch im alten
Modul stehen (Copy-Paste ohne Löschen der Quelle). `check_duplicate_functions()` bricht dann den Build
mit `[FEHLER] Doppelte Top-Level-Deklaration '<name>': <a> und <b>` ab, **bevor** irgendein Modul
gebündelt wird.
**Why it happens:** Reine Aufmerksamkeitslücke bei der Extraktion, nicht ein Build-System-Defekt.
**How to avoid:** D-06 sagt es explizit: "Das ist der gewünschte Ausgang — nicht umgehen." Der Plan
MUSS `python build.py` nach jeder Verschiebung laufen lassen, nicht erst am Ende der ganzen Datei.
**Warning signs:** Build bricht mit exakt dieser Fehlermeldung ab — das ist Erfolg, kein Blocker.

## Code Examples

### Whitelist-Prüfung für `call`-Aktion (SEC-03)
```javascript
// Zielmuster (neu), ersetzt ui/actions/ui-actions.js:186-190
const CALL_ACTION_WHITELIST = new Set([
    // Grep-Befehl zur Pflege dieser Liste zur Ausführungszeit:
    // rg -oP 'data-action="call"[^>]*data-value="\K[^"]+' --include='*.js' --include='*.html'
    // 131 Namen zum Recherche-Zeitpunkt, u.a.: addCombatant, addCustomCondition, saveCharacter,
    // saveNPC, saveLocation, saveQuest, toggleLinkForm, flipCoin, rollCustomDice, ...
]);
call: ctx => {
    if (!CALL_ACTION_WHITELIST.has(ctx.value)) {
        if (window.APP_CONFIG?.DEBUG_MODE && window.ErrorHandler) {
            window.ErrorHandler.log('EventDelegation', new Error('Blocked non-whitelisted call target'), ctx.value);
        }
        return;
    }
    const fn = window[ctx.value];
    if (typeof fn === 'function') fn(ctx.id);
},
```

### Escaping in `parseWikiLinks()` (SEC-04)
```javascript
// Aktuell (nur "-Ersetzen), Source: features/wiki/wiki.js:648-654 (VERIFIED, read this session)
function parseWikiLinks(content) {
    const D = window.D;
    return content.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
        const exists = D.wiki?.some(e => e.title.toLowerCase() === linkText.toLowerCase());
        const escapedText = linkText.replace(/"/g, '&quot;');   // <- nur Anführungszeichen, SEC-04-Fund
        return `<span class="wiki-link ${exists ? '' : 'missing'}" data-action="wiki-link-click-stop" data-value="${escapedText}" data-exists="${exists}">${linkText}</span>`;  // <- linkText UNescaped im Textknoten
    });
}
```
Fix: sowohl `escapedText` (für das `data-value`-Attribut) als auch der sichtbare `linkText` (im
Text-Node) müssen durch das projektweite `esc()` (aus `utils/basic.js`) laufen, nicht nur durch das
manuelle `"`-Ersetzen. Der Kommentar bei `wiki.js:432-434` ("nur deshalb ungefährlich, weil
sanitizeHTML() vorher bereits global bereinigt hat — NICHT ändern") muss nach dem Fix aktualisiert
werden, da die Abhängigkeit von der vorgelagerten Sanitisierung dann aufgelöst ist.

### Byte-Größe ohne Blob-Allokation (PERF-01/D-08)
```javascript
// Ersetzt an BEIDEN Stellen: persistence.js:42 (saveImmediate) und :205 (save)
// Aktuell: const dataSizeMB = new Blob([dataString]).size / (1024 * 1024);
function utf8ByteLength(str) {
    let bytes = 0;
    for (let i = 0; i < str.length; i++) {
        const code = str.codePointAt(i);
        if (code > 0xffff) i++; // Surrogate-Paar übersprungen
        if (code < 0x80) bytes += 1;
        else if (code < 0x800) bytes += 2;
        else if (code < 0x10000) bytes += 3;
        else bytes += 4;
    }
    return bytes;
}
const dataSizeMB = utf8ByteLength(dataString) / (1024 * 1024);
```
**Hinweis:** Dies ist ein Recherche-Vorschlag `[ASSUMED]`, kein verifizierter Bestandteil des
Quellcodes — der Planer/Executor muss die Korrektheit der UTF-8-Byte-Zählung selbst mit Testfällen
(inkl. mehrbytiger Emoji/Umlaute) beweisen, bevor sie den bewährten `Blob`-Weg ersetzt.

### Cursor-/Index-basierter Aggregat-Pfad für Würfelstatistik (PERF-02/D-12)
```javascript
// Vorbild bereits im Store: getStatsForSession() nutzt einen Index statt Vollscan
// Source: features/dice-stats/dice-stats-idb.js:54-70 (VERIFIED, read this session)
async function getStatsForSession(sessionId) {
    if (!window.initIndexedDB) return [];
    await window.initIndexedDB();
    return new Promise(function(resolve) {
        if (!window.idb) { resolve([]); return; }
        try {
            var tx = window.idb.transaction(['diceStats'], 'readonly');
            var store = tx.objectStore('diceStats');
            var index = store.index('sessionId');
            var req = index.getAll(sessionId);
            req.onsuccess = function() { resolve(req.result || []); };
            req.onerror = function() { resolve([]); };
        } catch (e) { resolve([]); }
    });
}
// Neuer Aggregat-Pfad (D-12) sollte ANALOG einen IDBCursor über den Store öffnen und
// Zähler/Summen inkrementell bilden (nie das volle Array materialisieren), statt getAllStats()
// zu rufen. dice-stats-render.js:233 ist die einzige Stelle, die umgestellt werden muss —
// audio-export.js:202,229 behält getAllStats() (D-12, expliziter Exportpfad).
```

### Guard-Parität für `initPerformanceMonitoring()` (MAINT-05)
```javascript
// Vorlage: startAutoBackup(), Source: systems/backups.js:306-308 (VERIFIED, read this session)
let backupInterval = null;
function startAutoBackup() {
    if (backupInterval) clearInterval(backupInterval);
    backupInterval = window.setInterval(createAutoBackup, BACKUP_INTERVAL);
    setTimeout(createAutoBackup, 60000);
}
// Fehlt bei initPerformanceMonitoring(), Source: systems/backups.js:321-330 (VERIFIED, read this session)
// AKTUELL — kein Guard, jeder Aufruf startet ein NEUES Interval:
function initPerformanceMonitoring() {
    updateEntityCounts();
    setInterval(() => { checkPerformance(); }, 30000);   // <- kein clearInterval vorher
    checkPerformance();
}
// Fix-Muster: dieselbe Modul-Variable + Guard wie startAutoBackup()
let perfMonitoringInterval = null;
function initPerformanceMonitoring() {
    if (perfMonitoringInterval) clearInterval(perfMonitoringInterval);
    updateEntityCounts();
    perfMonitoringInterval = setInterval(() => { checkPerformance(); }, 30000);
    checkPerformance();
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `document.execCommand()` für Formatierung/Einfügen | Selection/Range-DOM-Operationen (`insertTextAtSelection()`, `wrapRangeWithElement()`) | Phase 9 (2026-07-25) | MAINT-04 wendet dasselbe, bereits produktiv erprobte Muster auf die letzten 3 Aufrufstellen außerhalb des Editor-Moduls an — kein neues Verfahren nötig |
| `window.save`-Monkey-Patch für Live-Sync | `registerPostSaveHook()` explizite Registrierung | Vor Phase 12 (UAT 02 fand den strukturellen Defekt) | MAINT-06 muss nur noch die Kopfkommentare nachziehen — der Code selbst ist bereits korrekt |
| Drei-Pass-Build-Dedup mit Function-Body-Entfernung | `check_duplicate_functions()` Source-Pre-Check + Klammertiefen-Backstop | Phase 11 (ARCH-02/D-05) | Relevant für MAINT-01: die frühere Fehlerklasse ("orphaned function body") kann beim Datei-Split strukturell nicht mehr auftreten |

**Deprecated/outdated:** Keine weiteren — diese Phase führt keine neuen Muster ein, sie vervollständigt
drei bereits in Vorphasen begonnene Migrationen (execCommand, Post-Save-Hooks, Build-Dedup) und schließt
vier eigenständige Härtungslücken (SEC-03/04, PERF-01/02).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Konkreter UTF-8-Byte-Zähl-Algorithmus (Codepoint-Iteration ohne Surrogate-Fehler) als Ersatz für `new Blob([...]).size` | Code Examples → "Byte-Größe ohne Blob-Allokation" | Falsch gezählte Bytes verschieben den 5-MB-localStorage/IndexedDB-Fallback-Schwellenwert (`LS_LIMIT_MB`) — im schlimmsten Fall bleibt eine zu große Kampagne in localStorage hängen oder eine kleine wechselt unnötig zu IndexedDB. Muss vor Einsatz mit Umlaut-/Emoji-Testfällen bewiesen werden. |
| A2 | Konkreter Wortgrenzen-Regex-Ersatz (`(?<![\w])`/`(?![\w])` statt `(?<!_)`/`(?!_)`) für die Unterstrich-Emphase-Regeln | Architecture Patterns → Pattern 3 | Falscher Regex könnte legitime Emphase (z. B. `_kursiv_` am Satzanfang/-ende) brechen oder die URL-Korruption nicht vollständig beheben. `tests/unit/markdown-converter.test.js` und `markdown-shortcuts.test.js` müssen als Regressionsnetz laufen; ein neuer Testfall für `Der_Hobbit_Buch`-artige URLs fehlt heute (Wave-0-Lücke). |
| A3 | Vorgeschlagene Aufteilung der 423-zeiligen "NEUE REFERENZ-WIDGETS"-Sektion in `dmscreen-render.js` (3-4 thematische Gruppendateien) | Architecture Patterns → Recommended Project Structure | Der Planer könnte eine andere, ebenso gültige Gruppierung wählen (z. B. rein alphabetisch oder nach Zeilen-Balance statt nach Thema) — die vorgeschlagene Gruppierung ist eine Empfehlung, kein aus dem Code ableitbares Faktum. |
| A4 | 131 gefundene `data-action="call"`-Ziele sind vollständig — keine dynamischen Ziele existieren | Architecture Patterns → Pattern 2 | Falls doch eine Stelle `data-value="${variable}"` dynamisch mit `data-action="call"` kombiniert (vom Grep-Muster nicht erfasst, z. B. wegen abweichender Attributreihenfolge oder mehrzeiligem Template-String), würde die Whitelist diesen Aufruf fälschlich blockieren ODER — schlimmer — der Grep-Lauf zur Ausführungszeit müsste diesen Fall gesondert behandeln. Empfehlung: Planer wiederholt den Grep mit zusätzlichen Mustervarianten (umgekehrte Attributreihenfolge, mehrzeilig) vor Fertigstellung der Whitelist. |

## Open Questions

1. **Wie groß ist der "großzügige Deckel" für die Würfelstatistik (D-11)?**
   - What we know: D-11 sagt nur "großzügig gesetzt, sodass er für einen realen Spielleiter praktisch
     nie greift"; Phase-12-Recherche hat den Worst-Case-Speicherbedarf auf ~15 MB für den gesamten
     `diceStats`-Store geschätzt (`12-CONTEXT.md`, offene Frage 3).
   - What's unclear: Ob der Deckel auf Datensatzanzahl (z. B. 50.000 Würfe) oder auf eine geschätzte
     Byte-Grenze gesetzt werden soll — beides ist mit D-11 vereinbar.
   - Recommendation: Der Plan sollte eine konkrete Zahl wählen und begründen (z. B. "50.000 Datensätze
     ≈ X Jahre bei Y Würfen/Session laut Nutzerprofil") statt "großzügig" unspezifiziert zu lassen —
     sonst ist Erfolgskriterium 3 nicht binär prüfbar.

2. **Reicht ein Charakterisierungs-Snapshot-Test für `dmscreen-render.js` (D-04) auch nach der
   Aufteilung in 3-4 Dateien noch als vollständiger Beweis?**
   - What we know: D-04 verlangt einen Snapshot ALLER 21 Widget-Typen gegen das ungeteilte Modul, VOR
     der ersten Verschiebung.
   - What's unclear: Ob derselbe Snapshot-Test nach dem Split unverändert weiterläuft (er müsste dann
     `getDMScreenWidgets()` aus mehreren neuen Dateien zusammengesetzt aufrufen) oder ob er pro
     Zieldatei aufgespalten werden muss.
   - Recommendation: Snapshot-Test gegen die öffentliche API (`window.renderDMScreen`/
     `getDMScreenWidgets()`) schreiben, nicht gegen interne Funktionsnamen — dann bleibt er über den
     Split hinweg unverändert lauffähig, unabhängig davon, in welcher Datei die einzelnen
     Widget-Renderer am Ende liegen.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Jest, ESLint, Prettier, tsc | ✓ | v24.14.0 | — |
| npm | Test-/Lint-/Build-Skripte | ✓ | 11.19.0 | — |
| Python | `build.py`, `validate.py` | ✓ | 3.14.7 | — |
| Playwright | E2E-Suite | ✓ | 1.57.0 | — |

**Missing dependencies with no fallback:** Keine.
**Missing dependencies with fallback:** Keine — alle für diese Phase benötigten Werkzeuge sind bereits
installiert und funktionsfähig `[VERIFIED: Bash dieser Sitzung — node/npm/python/playwright --version]`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.2.0 (Unit, `jest.config.cjs`) + Playwright 1.57.0 (E2E, `playwright.config.js`) |
| Config file | `jest.config.cjs` (testEnvironment: jsdom, setupFilesAfterEnv: `tests/setup.js`), `playwright.config.js` (testDir: `tests/e2e`, baseURL: `dist/dnd-tracker-bundled.html`) |
| Quick run command | `npx jest tests/unit/<datei>.test.js` |
| Full suite command | `npm run test` (Jest) + `python build.py && npx playwright test` (E2E braucht frischen Bundle — siehe STATE.md-Hinweis "Playwright läuft gegen dist/..., npm run build schreibt nur Production-Bundle") |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|--------------|
| SEC-03 | `call`-Aktion blockiert nicht-Whitelist-Ziele | unit | `npx jest tests/unit/event-delegation.test.js -x` | ❌ Wave 0 — keine dedizierte Unit-Test-Datei für `ui/event-delegation.js`/`ui-actions.js` gefunden `[VERIFIED: find über tests/ dieser Sitzung]` |
| SEC-03 | `call`-Aktion ruft weiterhin legitime Ziele | e2e | `npx playwright test tests/e2e/integration/workflows.spec.js` | ✅ (nutzt bereits `[data-action="call"]`-Selektoren) |
| SEC-04 | `parseWikiLinks()` escapt `linkText` vollständig | unit | `npx jest tests/unit/wiki*.test.js -x` | ❌ Wave 0 — keine `wiki.test.js`-Unit-Datei gefunden; nur E2E (`tests/e2e/features/wiki.spec.js`) |
| PERF-01 | Save-Pfad ohne Blob-Allokation, gleiche Schwellenwerte | unit | `npx jest tests/unit/stability.test.js -t "saveImmediate"` | ✅ `describe('saveImmediate() function'` existiert bereits (`stability.test.js:158`) |
| PERF-01 | Undo-Dedupe + Byte-Budget verdrängt älteste Einträge | unit | `npx jest tests/unit/stability.test.js -t "Undo"` | ✅ Undo/Redo-Describe-Blöcke existieren bereits (`stability.test.js:1244,1273`); Dedupe/Byte-Budget-Fälle fehlen noch (Wave-0-Ergänzung nötig) |
| PERF-02 | `diceStats`-Store hat Cap + Löschfunktion | unit | `npx jest tests/unit/dice-stats.test.js -x` | ❌ Wave 0 (teilweise) — Datei existiert und testet reine Berechnungsfunktionen, aber KEINE IDB-Layer-Tests (`statsIdbPut`/Cap/Delete fehlen) |
| MAINT-01 | Alle vier Splits verhaltensneutral | e2e (voller Lauf) | `python build.py && npx playwright test` | ✅ Bestehende Suite (321 passed/2 skipped laut STATE.md) ist das Gate |
| MAINT-01 (`dmscreen-render.js`) | Charakterisierungs-Snapshot vor Split | unit (neu) | `npx jest tests/unit/dmscreen-characterization.test.js -x` | ❌ Wave 0 — muss laut D-04 VOR jeder Verschiebung existieren |
| MAINT-03 | Unterstrich-URLs werden nicht mehr korrumpiert | unit | `npx jest tests/unit/markdown-converter.test.js -x` | ✅ Datei existiert (29 Tests gefunden), aber kein Testfall für `foo_bar_baz`-URL-Muster (Wave-0-Ergänzung) |
| MAINT-04 | 0 `execCommand`-Treffer außerhalb Kommentaren | smoke (grep) | `grep -rn "execCommand" --include=*.js . \| grep -v "//.*execCommand"` | ✅ als CI-Grep umsetzbar, kein neues Testframework nötig |
| MAINT-05 | `initPerformanceMonitoring()` startet kein zweites Interval bei erneutem Aufruf | unit | `npx jest tests/unit/backups.test.js -x` | ❌ Wave 0 — keine dedizierte `backups.test.js` gefunden; `startAutoBackup()`-Guard-Verhalten müsste als Vorlage für einen neuen Testfall dienen |
| MAINT-06 | Keine ungeguardeten `console.*`-Aufrufe in Produktionspfaden | smoke (grep) | `grep -rnE "console\.(log\|error\|warn\|info\|debug)" --include=*.js . \| grep -v tests/ \| grep -v dist/` | ✅ als CI-Grep umsetzbar; 89 aktuelle Treffer sind die Baseline vor dem Fix |

### Sampling Rate
- **Per task commit:** die jeweils betroffene(n) Unit-Test-Datei(en) aus obiger Tabelle
- **Per wave merge:** `npm run test` (voller Jest-Lauf)
- **Phase gate:** `python build.py && npx playwright test` grün, PLUS die MAINT-04/MAINT-06-Grep-Checks
  liefern 0 Treffer außerhalb Kommentaren/DEBUG_MODE-Guards, bevor `/gsd-verify-work` läuft

### Wave 0 Gaps
- [ ] `tests/unit/event-delegation.test.js` (neu) — deckt SEC-03 (Whitelist-Block + legitime Ziele)
- [ ] Testfall in `tests/unit/wiki*.test.js` oder neue Datei — deckt SEC-04 (`parseWikiLinks()`-Escaping,
      insbesondere `linkText` mit `<`/`>`/`"`/`'`)
- [ ] Testfälle in `tests/unit/stability.test.js` — Undo-Dedupe (identischer Snapshot wird nicht
      gepusht) und Byte-Budget-Verdrängung (PERF-01/D-09)
- [ ] `tests/unit/dice-stats-idb.test.js` (neu, mit `createMockIDB`-Muster) — deckt PERF-02 (Cap,
      Löschfunktion, Aggregat-Cursor-Pfad)
- [ ] `tests/unit/dmscreen-characterization.test.js` (neu) — MUSS vor der ersten Codeverschiebung in
      `dmscreen-render.js` existieren und grün sein (D-04, harte Reihenfolge-Vorgabe)
- [ ] Testfall in `tests/unit/markdown-converter.test.js` — `foo_bar_baz`-artige URL bleibt nach Fix
      unkorrumpiert; zusätzlich ein Regressionsfall, dass `hasHtmlTags`-Entfernung bestehende
      HTML-Erkennung (Tabellen/Read-Aloud-Divs) nicht bricht
- [ ] `tests/unit/backups.test.js` (neu oder Ergänzung in `stability.test.js`) — Guard-Parität
      zwischen `startAutoBackup()` und `initPerformanceMonitoring()` bei mehrfachem Aufruf

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V2 Authentication | Nein | Einzelnutzer-Offline-App, kein Login |
| V3 Session Management | Nein | Kein Server-Session-Konzept |
| V4 Access Control | Ja (SEC-03) | Explizite Whitelist-Konstante statt impliziter Namenskonvention für dynamisch aufgerufene Funktionsnamen (`window[ctx.value]`) |
| V5 Input Validation / Output Encoding | Ja (SEC-04, MAINT-03) | Projektweites `esc()` (`utils/basic.js`) für jeden in HTML eingebetteten Nutzertext; `sanitizeHTML()` als Allowlist-Sanitizer VOR jeder Markdown-Konvertierung (bereits etabliertes Muster aus Phase 10, SECURITY.md Abschnitt 1) |
| V6 Cryptography | Nein | Keine Kryptographie in dieser Phase |
| V10 Malicious Code (Supply Chain) | Nein (kein neues Paket) | — |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Beliebiger Funktionsaufruf über `window[beliebigerString]` (SEC-03) | Tampering / Elevation of Privilege | Explizite Allowlist (`CALL_ACTION_WHITELIST`) statt Blocklist oder Namenskonvention; heute nur durch `sanitizeHTML()`s `data-*`-Attribut-Filter als Defense-in-Depth abgesichert (`[CITED: .planning/codebase/CONCERNS.md:133]`) — jeder künftige ungefilterte Renderpfad würde diese zweite Schicht umgehen |
| Reflektiertes/gespeichertes XSS über unescapten Regex-Capture-Text (SEC-04) | Tampering | `esc()` auf JEDEN aus Nutzerdaten stammenden Text vor HTML-Einbettung, nicht nur punktuelles Zeichen-Ersetzen (`"` → `&quot;` allein reicht nicht, da `<`/`>`/`'` unbehandelt bleiben) |
| Anzeige-Korruption durch fehlerhafte Regex-Wortgrenzen (MAINT-03) | Information Disclosure (schwach — Anzeigebug, kein Datenverlust) | Wortgrenzen-Prüfung vor Emphase-Erkennung; kein Sicherheits-, sondern reiner Korrektheits-Fix, hier der Vollständigkeit halber aufgeführt, da MAINT-03 im selben Modul wie SEC-04 liegt |

## Sources

### Primary (HIGH confidence — Live-Code dieser Sitzung gelesen)
- `ui/actions/ui-actions.js`, `features/wiki/wiki.js`, `systems/entity-links.js`,
  `ui/actions/system-actions.js`, `utils/basic.js`, `ui/editors/markdown-converter.js`,
  `systems/spellslots/persistence.js`, `features/soundboard/soundboard-player.js`,
  `systems/backups.js`, `tools/debug.js`, `systems/tab-registry.js`,
  `systems/file-backup/file-backup-manager.js`, `features/dice-stats/dice-stats-idb.js`,
  `features/dice-stats/dice-stats-render.js`, `systems/migration/audio-export.js`,
  `systems/undo.js`, `ui/event-delegation.js`, `loader.js`, `eslint.config.js`,
  `jest.config.cjs`, `playwright.config.js`, `package.json`, `.planning/config.json` —
  alle mit Zeilennummern in den obigen Tabellen zitiert
- Alle vier MAINT-01-Zieldateien vollständig gegen ihre Sektionsbanner gelesen (`ui/editors/rich-text.js`,
  `features/initiative.js`, `features/dmscreen/dmscreen-render.js`, `features/wiki/wiki.js`)
- Referenzdateien zur D-01-Größenklassen-Verifikation: `features/encounter-calculator.js`,
  `systems/migration/migration-wizard.js`, `features/shops/shops-core.js`, `features/dice/dice-core.js`,
  `features/random-tables.js`, `core/srd-monsters.js`

### Secondary (MEDIUM confidence)
- CommonMark-Spezifikation (Underscore-Emphase-Wortgrenzen-Regel) — über WebSearch zitiert, nicht direkt
  auf spec.commonmark.org gegengelesen `[CITED: commonmark-spec, via Recherche-Zusammenfassung]`
- `CLAUDE.md` (Projektinstruktionen) — execCommand-Ablösung, Live-Sync-Pattern, Build-Dedup — als
  Projektregeln übernommen, nicht in dieser Sitzung neu verifiziert (aber durch die Live-Code-Reads
  bestätigt konsistent)

### Tertiary (LOW confidence)
- Keine — diese Phase hatte keine Fragen, die nur per unbestätigtem WebSearch beantwortbar waren

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — keine neue Dependency, vollständig durch `package.json`-Lektüre bestätigt
- Architecture (Sektionsgrenzen/Zeilenzahlen): HIGH — jede Zahl in diesem Dokument wurde gegen die
  Live-Datei gelesen, keine aus Trainingsdaten übernommen
- Pitfalls: HIGH für die drei gefundenen Korrekturen (mit Grep+Read belegt); MEDIUM für die
  vorgeschlagenen Regex-/Byte-Zähl-Fixes (als Implementierungsvorschlag markiert, nicht verifizierter
  Bestandteil des Codes)

**Research date:** 2026-09-06
**Valid until:** ~14 Tage (Zeilennummern verschieben sich mit jedem Commit auf denselben Dateien —
kürzeres Intervall als sonst üblich, da diese Phase selbst mehrere Dateien in schneller Folge verändert;
der Planer sollte kritische Zeilenzitate bei Ausführung erneut gegenprüfen, siehe Pitfall 1)
