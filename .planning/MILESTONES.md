# Milestones

## v1.2 Schulden-Abbau (Shipped: 2026-09-07)

**Phases completed:** 3 phases, 38 plans, 98 tasks

**Key accomplishments:**

- Undo/Redo prüft und parst jetzt VOR dem Stack-Pop statt danach, `pushUndo()` validiert Serialisierbarkeit vor dem Push, `registerUndoHook()` steht bereit, und der tote `autosave-toggle`-Codepfad ist an allen vier Fundstellen entfernt.
- `removeAudioFile()` löscht Audiodateien jetzt aufgeschoben (Grabstein statt Sofortlöschung) und sichert vorher per `saveUndoState()` — `Strg+Z` stellt dadurch sowohl die Szenen-Referenz als auch die Datei selbst wieder her, bewiesen bis in eine echte Browser-Session inklusive Reload.
- `isFreshInstall()` zählt Kampagneninhalt jetzt über 22 belegte Stellen (17 Arrays, 2 Textfelder, 3 verschachtelte Pfade) statt nur `characters`/`npcs`/`quests` — eine Kampagne mit ausschließlich einer Zauberbibliothek löst den Bestandsschutz-Dialog vor dem Import jetzt korrekt aus, während eine wirklich leere Installation weiterhin als frisch gilt.
- wizard-skip nimmt ab Schritt 4 denselben reload()-Pfad wie wizard-close, Footer verschwindet dort — der beforeunload-Autosave kann frisch importierte Daten nicht mehr rückstandslos überschreiben.
- `readCampaignDataForBackup()`s Stufe-3-Fallback gibt `window.D` nur noch fuer die tatsaechlich angefragte, aktive Kampagne zurueck — statt bislang fuer jede beliebige.
- `pushUndo()`s `catch`-Zweig leert jetzt den Redo-Stack, bevor er zurückkehrt — beide `dist/`-Bundles sind aus dem vollständigen Quellstand aller drei Gap-Closure-Pläne dieser Runde neu gebaut.
- Inhaltsbasierte Leerprüfung (`_hatKampagnenInhalt()`) ersetzt die reine Schlüsselzahl in `readCampaignDataForBackup()`, und `resolveBackupTargets()` löst den Namen des aktiven Backup-Ziels jetzt aus dem Index auf statt ihn bedingungslos "Standard-Kampagne" zu nennen.
- `undo()` und `redo()` sichern den aktuellen Stand jetzt in try/catch (wie `pushUndo()`), bevor sie den jeweils anderen Stack verändern — ein nicht serialisierbares `window.D` löst beim nächsten Strg+Z/Strg+Y einen Warn-Toast statt einer ungefangenen `TypeError`-Ausnahme aus.
- Beide Fundstellen von SEC-01 (Haupt- und Audio-Import in `migration-wizard.js`) strukturell geschlossen: der Import-`try` endet jetzt unmittelbar nach dem Ruecksprung aus der jeweiligen Importfunktion, der gesamte Nachlauf liegt ausserhalb und kann einen bereits gelungenen, unwiederholbaren Umzug nicht mehr als Fehlschlag ausgeben — abgesichert durch eine test.each-Invariante ueber drei unabhaengige Wurfstellen plus Gegenprobe.
- `importAudioExport()` prüft jetzt Einzelgröße UND Gesamtvolumen VOR jedem Base64-Decode — ein einzelner übergroßer oder viele mittelgroße Einträge frieren den Tab nicht mehr ein, ohne den restlichen Import zu blockieren.
- Der einmalige Umzugs-Import ueberschreibt keine lokalen Wuerfel-Favoriten und Kampagnen-Index-Eintraege mehr, die Frischinstallations-Erkennung ist gegen alle 38 im Repo verwendeten D-Schluessel vollstaendigkeitsgeprueft, und die Audio-Importgrenze leitet sich aus der Exportgrenze ab statt unabhaengig davon zu stehen.
- Alle drei Suiten (Jest 893/893, pytest tests/build 24/24, Playwright 321 passed/2 skipped) sind grün gegen den vollständigen Quellstand aller fünf Fix-Pläne dieser Runde gemessen, und beide dist-Bundles wurden aus genau diesem Stand neu gebaut (124/124 Module, keine Namenskollision, nachweislich jünger als jede geänderte Quelldatei).
- `UIActions.call` ruft `window[ctx.value]` jetzt nur noch auf, wenn der Name in einer 130-Einträge-Allowlist `CALL_ACTION_WHITELIST` steht — Fehlerpfad protokolliert über `ErrorHandler.log()` hinter `DEBUG_MODE` statt roher Konsolenausgabe.
- Letzte drei `document.execCommand`-Aufrufstellen auf die Phase-9-Hilfsfunktionen umgestellt, `parseWikiLinks()` escapt jetzt Attributwert UND sichtbaren Textknoten über `esc()`, doppeltes `data-id` im Wiki-Baum entfernt.
- Gehärtete Unterstrich-Emphase-Regexe nach CommonMark-Wortgrenzenregel plus Entfernung des nie gelesenen `hasHtmlTags`-Wächters in `ui/editors/markdown-converter.js`.
- `initPerformanceMonitoring()` bekam dieselbe Mehrfachstart-Guard wie `startAutoBackup()`, die Tab-Registry löst Render-/Init-/Cleanup-Funktionen jetzt über verzögerte Funktionsreferenzen statt `window[name]`-Strings auf, und zwei tote `mindmap`-Seeds plus die `const D`-Überschattung im Soundboard-Player sind entfernt.
- Checked-in vm-sandbox snapshot net (50 entries) for the unsplit `features/dmscreen/dmscreen-render.js`, keyed to `loader.js` MODULES and the public surface — the hard precondition Plan 13-12 needs before splitting that file.
- `utf8ByteLength()` ersetzt an beiden Save-Aufrufstellen die zweite `new Blob(...)`-Vollkopie, `pushUndo()`/`redo()` deduplizieren und deckeln den Undo-Stack mit Untergrenze, und die verbleibende Undo-Redundanz ist gegen eine realistische Kampagne gemessen statt vermutet.
- Der `diceStats`-IndexedDB-Store trägt jetzt einen harten, vom Nutzer entschiedenen Deckel (50.000 Datensätze, ältestes zuerst verdrängt), eine mit Rückfrage abgesicherte Löschfunktion, und die Auswertung aggregiert per Cursor statt den gesamten Store zu laden — der Umzugs-Export bleibt unverändert vollständig.
- `features/wiki/wiki.js` (1223 Zeilen) entlang seiner Sektionsbanner in `wiki.js` (554, STATE/CONSTANTS/RENDER) und `features/wiki/wiki-crud.js` (673, WIKI CRUD + WIKI UX IMPROVEMENTS) aufgeteilt, beide unter der 800-Zeilen-Grenze, in `loader.js` registriert, Verhalten unverändert bestätigt durch den vollen Suiten-Lauf.
- `features/initiative.js` (1655 Zeilen) entlang seiner Sektionsbanner in `initiative.js` (616, Kern), `initiative-loot.js` (392, LOOT SYSTEM) und `initiative-combat-widgets.js` (670, EFFECTS/DEATH SAVES/LEGENDARY/CONCENTRATION/AOE) aufgeteilt, alle drei unter der 800-Zeilen-Grenze, in `loader.js` registriert, Verhalten unverändert bestätigt durch den vollen Suiten-Lauf.
- `ui/editors/rich-text.js` (1932 Zeilen) zuerst entflochten (D-03: Zauberverwaltung nach `features/spells/spell-manager.js` ausgelagert) und dann aufgeteilt (D-02: 799-Zeilen-Formatierungssektion entlang der Phase-9-Spezifikationsgrenze in `rich-text.js` und `rich-text-insert.js`, Toolbars in `rich-text-toolbars.js`) — vier Dateien, alle unter 800 Zeilen, das eingefrorene 79-Test-Netz aus Phase 9 (tatsächlich 84 Tests) grün vor und nach jeder Verschiebung, volles Suiten-Gate bestanden.
- `features/dmscreen/dmscreen-render.js` (1576 Zeilen, 21 Widget-Typen, ohne eigenes Testnetz) in fünf Dateien geteilt, abgesichert durch den in Plan 13-05 eingefrorenen Charakterisierungs-Snapshot gegen das ungeteilte Modul — Snapshot vor und nach jeder Verschiebung zeichengleich grün, alle fünf Ergebnisdateien unter 800 Zeilen, volles Suiten-Gate bestanden, Bedienprobe freigegeben. Damit ist MAINT-01 über alle vier Aufteilungen der Phase (13-09 bis 13-12) vollständig erfüllt.
- Generator leitet 1398 Cross-Modul-Globals aus `loader.js MODULES` ab (ARCH-01); `no-undef` fällt von 1829 auf genau die 7 in D-09 benannten toten Fundstellen, mit Drift-Wächter und `npm run globals:generate` als reproduzierbarem Regenerierungsweg.
- `seedCleanSession(page)` als einziger Seed-Helfer in `test-utils.js` extrahiert und in allen fünf CRUD-E2E-Specs verdrahtet — Fix belegt durch protokollierten roten Vorlauf und zwei grüne Nachläufe bei identischen Lastparametern, nicht durch einen grünen Lauf allein.
- Die 520-zeilige Sammel-Spec `welt-story.spec.js` (26 Tests, fünf `describe`-Blöcke) mechanisch und verhaltensneutral in fünf dedizierte Dateien unter `tests/e2e/features/` zerlegt, benannt nach Quellverzeichnis statt Planungscode.
- Die 593-zeilige Sammel-Testdatei `tests/unit/welt-story.test.js` (37 Tests, fünf `describe`-Blöcke) mechanisch und verhaltensneutral in fünf dedizierte Dateien unter `tests/unit/` zerlegt, benannt nach Quellverzeichnis statt Planungscode — spiegelbildlich zu Plan 14-04s E2E-Aufteilung und damit die zweite, in `DEBT-28` ausdrücklich geforderte Hälfte von `TEST-04`.
- Sieben tote/fehlerhafte `data-action`-Ziele behandelt (ein echter `ReferenceError` im Zauber-Tab behoben, sechs verwaiste Registrierungen entfernt), `no-undef` auf `error` gehoben (0 Fehler), und die Warnungsgrenze exakt auf den gemessenen Reststand von 367 gepinnt — `lint:all` entfällt.
- Zweite tsconfig.strict.json mit `checkJs: true` gegen eine frisch erhobene, 8-Datei-Zulassungsliste — eine Selbstkonsistenz-Probe deckte auf, dass 9 der zunaechst 17 gemessenen Kandidaten nur unter vollem Compile-Kontext fehlerfrei sind, nicht isoliert.
- `jest.config.cjs`s `roots` reparierte die tote Coverage-Konfiguration (2 → 125 instrumentierte Dateien, ehrliche 0,77% Statement-Coverage in `14-GATE-BASELINE.md` dokumentiert), und die vier Einzelschwellen für `utils/testable-utils.js` sitzen jetzt beweisbar am gemessenen Stand statt 13 Punkte darunter.
- Ein schärferes Coverage-Gate ersetzt die für diese Architektur bedeutungslose globale Statement-Schwelle: `tests/unit/module-test-coverage.test.js` prüft, dass jedes von `loader.js MODULES` geladene Modul von mindestens einem Test wörtlich per Pfad angefasst wird, mit einer datierten 78-Modul-Ausnahmeliste als Ratsche — beidseitig als rot-machend bewiesen, und der Phasenabschluss steht als Vorher/Nachher-Zahlentabelle in `14-GATE-BASELINE.md`.

---

## v1.1 Tech-Debt & Härtung (Shipped: 2026-07-27)

**Delivered:** Die Codebasis schuldenfrei und dauerhaft wartbar gemacht — deprecated APIs abgelöst, Test-Suite belastbar, Sicherheits-Altlasten geschlossen, Build-Architektur begradigt. Verhaltensneutral: keine Feature-Änderung aus Nutzersicht.

**Umfang:** 4 Phasen (8–11) · 27 Pläne · 69 Tasks · 185 Commits · 155 Dateien, +27.726 / −1.765 Zeilen · 22.07.2026 → 27.07.2026
**Qualität:** Jest 628 · Playwright 319 (2 skipped) · pytest 24 — alle grün · 11/11 Requirements · alle 4 VERIFICATIONs passed · Nyquist 4/4 validated · CI-Lauf 30301635918 mit sechs grünen Jobs

**Key accomplishments:**

1. **Test-Fundament belastbar** — 11 vorbestehende E2E-Fails behoben, davon drei echte App-Bugs (Action-Registry-Kollision, `renderAll()`-Dispatch-Lücke, Migration-Banner-Overlay); `e2e` blockiert seither die Deploy-Kette. Fails sind wieder als echte Regressionen lesbar statt als Grundrauschen.
2. **`execCommand` vollständig abgelöst** — 21 → 0 im Editor, drei dokumentierte Ausnahmen ausserhalb. Entscheidend war die Reihenfolge: erst die Markup-Baseline messen (`09-BASELINE.md`), dann das 79-Test-Netz bauen, dann migrieren. Ein Netz mit geratenen Sollwerten hätte nichts abgesichert.
3. **Security mit echtem Nachweis** — Import-XSS geschlossen; die Sanitizer-Tests laufen seither gegen den Produktionsquelltext statt gegen eine Kopie; vier `SECURITY.md` (Phasen 1, 2, 9, 10) mit je `threats_open: 0`.
4. **Build-Architektur begradigt** — eine Modulliste in `loader.js` statt zweier synchron zu haltender, mit Hard-Abort bei fehlender Datei; Dedup-Pass 3 ersatzlos entfernt und durch einen Quell-Pre-Check *vor* dem Bündeln ersetzt, wodurch die Klasse „stilles Bundle mit verwaistem Funktionsrumpf" strukturell verschwindet.
5. **Zwei Funde, die erst das Bestehen auf echten Nachweisen sichtbar machte** — eine unvollständige CI-Artefakt-Paketierung (der `smoke-test` prüfte ein Artefakt ohne Service Worker; lokal grün, weil dort Altbestände lagen) und ein stiller Datenverlust im Datei-Backup ab 5 MB Kampagnengröße, bei dem `pruneOldSnapshots()` binnen zehn Spieltagen alle echten Snapshots wegräumte — bei durchgehend grüner Statusanzeige. Beide behoben (`bfd6447`, `71fb6ef`).

**Übertrag nach v1.2:** 27 dispositionierte `DEBT`-Posten mit Live-Code-Belegen — das Produkt von ARCH-04, nicht dessen Versäumnis. Schwerste: `DEBT-18` (Umzugs-Export verliert Soundboard-Audio und Würfelstatistik aus IndexedDB), `DEBT-19` (Audio-Löschen ohne Undo), `DEBT-21/22` (Datei-Backup deckt nur die aktive Kampagne ab; Dateinamen können kollidieren).

**Archive:** [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md) · [v1.1-REQUIREMENTS.md](milestones/v1.1-REQUIREMENTS.md) · [Audit](v1.1-MILESTONE-AUDIT.md)

---

## v1.0 Stabilisierung & Ausbau (Shipped: 2026-07-22)

**Delivered:** Vollständiger offline-first D&D-5e-Spielleiter-Begleiter — vom nicht startenden Prototyp zum installierbaren, getesteten Kampagnen-Tracker mit Bestiary, Kampf-Tiefe, Weltwerkzeugen, Spieler-Verwaltung und Soundboard.

**Umfang:** 7 Phasen · 44 Pläne · 83 Tasks · 517 Commits · ~81.000 Zeilen Quellcode · 28.12.2025 → 22.07.2026
**Qualität:** 453 Unit-Tests grün · Phasen-E2E grün · 31/31 Requirements · UAT 20/20 (alle 5 Human-UAT-Sessions) · alle 7 VERIFICATIONs passed

**Key accomplishments:**

1. **Stabilisierung** — von „App startet nicht" zu robustem file://-first-Boot mit LS+IDB-Dual-Persistenz (>5-MB-IDB-Fallback, deterministische D-07-Konfliktauflösung, sauberer Konsolen-Boot)
2. **PWA-Fundament** — installierbar via GitHub Pages (CI-Deploy), SW-Update-Hinweis ohne Zwangs-Reload, Datei-Backup per Ordner-Handle (generischer Post-Save-Hook), Migrations-Wizard file://→PWA mit Divergenz-Banner
3. **Bestiary** — 112 deutsche SRD-5.1-Statblocks offline (lazy IDB-Cache), Pergament-Optik mit klickbaren Würfeln, Encounter-/Initiative-Integration mit Auto-Roll+HP-Variation
4. **Kampf-Tiefe** — Legendary Actions, Mob-Mode, Death Saves, Concentration-Tracker, AoE-Rechner, Quick-Actions, Rest-Manager
5. **Welt & Story** — NPC-Generator (Modal, deutsch), Harptos-Kalender (kanon-geprüft), Reise-Rechner, Fraktionen mit Ruf-System, Session-Prep, Entity-Links
6. **Spieler & Komfort** — XP-/Milestone-Leveling mit Verteilungs-Modal, Inspiration, klickbare Skill-/Save-/Angriffs-Würfe, Soundboard (Web-Audio-Szenen mit Crossfade-Loops, Quick-Slots), Würfel-Statistiken (d20-Histogramm)

**Archive:** [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) · [v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md)

---
