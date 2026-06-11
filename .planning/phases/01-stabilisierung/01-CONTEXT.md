# Phase 1: Stabilisierung - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Die App läuft zuverlässig: Boot-Crash (`clearMindmap`, tools/debug.js:99) behoben, keine stillen Datenverluste bei großen Kampagnen, CI erkennt künftige Boot-Brüche, Build-Pipeline gehärtet, Doku und Repo spiegeln den echten Code-Stand. Requirements STAB-01 bis STAB-11. Keine neuen Features — reine Stabilisierung.

</domain>

<decisions>
## Implementation Decisions

### Persistenz-Fix >5MB (STAB-05, STAB-06)
- **D-01:** Stale-Shadow-Bug wird per **Timestamp-Vergleich beim Laden** behoben: Beide Speicher (LocalStorage + IndexedDB) tragen Zeitstempel, beim Laden gewinnt der neueste Stand. Redundanz bleibt erhalten; bereits betroffene Kampagnen reparieren sich beim nächsten Laden selbst. (IDB-Einträge tragen bereits `timestamp` — persistence.js:80; die LS-Seite braucht einen Begleit-Zeitstempel.)
- **D-02:** Beim Wechsel in den IDB-only-Modus: **einmaliger Event-Log-Hinweis** pro Sitzung. Der bestehende Per-Save-Erfolgs-Toast („Große Kampagne in IndexedDB gespeichert") wird darin konsolidiert — kein Toast-Spam am Spieltisch.
- **D-03:** Schlägt das IndexedDB-Schreiben fehl (Daten dann nur im RAM): **deutlicher Fehler-Toast + Export-Aufforderung**. Datenverlust-Risiko muss am Tisch sofort sichtbar sein.
- **D-04:** **Jest-Unit-Test** als Regressionstest: Save/Load-Roundtrip mit >5MB-Daten (gemockter Storage). Kein E2E-Test erforderlich.
- **D-05:** Export-Stempel nutzt `APP_CONFIG.VERSION` statt hartkodiert `'2.11'` (quick-roll.js:133). Bestehende Export-Dateien mit `'2.11'` werden beim Import **als Legacy-Stempel erkannt** und als Altformat behandelt → Migrationen laufen korrekt.
- **D-06:** App-Version wird auf **2.6.1** angehoben (Patch-Bump): `APP_CONFIG.VERSION` und `package.json` synchron.
- **D-07:** Erstlade-Konflikt nach dem Fix (LS-Stand ohne Timestamp UND abweichender IDB-Stand mit Timestamp): **einmaliger Auswahl-Dialog** zeigt beide Stände (Größe, IDB-Speicherdatum), der Nutzer wählt. Kein stiller Datenverlust. Sind die Inhalte identisch: kein Dialog. Danach existieren beidseitig Timestamps — der Dialog erscheint nie wieder.
- **D-08:** 4-MB-Warnung („Kampagne wird groß — Backup empfohlen"): **einmal pro Sitzung** als Toast, danach nur noch Event-Log-Eintrag (aktuell feuert sie bei jedem Save im 4–5-MB-Fenster).

### Mindmap-Altdaten (STAB-02)
- **D-09:** `D.mindmap` in bestehenden Speicherständen und Importen: **Smart-Strip**. Leere mindmap-Keys (`{nodes:[],connections:[]}`) werden still per Migration entfernt (Normalfall — jede Kampagne trägt den leeren Seed). Enthält eine Kampagne echte Mindmap-Inhalte: einmaliger Hinweis-Dialog mit Export-Angebot vor dem Strippen. Kein stiller Verlust von Nutzer-Inhalten.
- **D-10:** Export-Format beim Smart-Strip: **eigene JSON-Datei** (`mindmap-backup-{kampagne}.json` mit nodes/connections) als Download im Hinweis-Dialog.
- **D-11:** `tools/debug.js` (Boot-Crash-Verursacher, 1.109 Zeilen, in dev+prod gebündelt): **nur reparieren** — tote Mindmap-Referenzen entfernen (u.a. `const clearAllNodes = clearMindmap;` Zeile 99). Bleibt in beiden Bundles, kein Build-System-Umbau dafür.
- **D-12:** Veraltete Python-Tools: `tools/analyze-render.py`, `tools/migrate-event-handlers.py`, `tools/split-shops.py`, `tools/purge-css.py` **löschen** (Zweck erfüllt bzw. Output ungenutzt). `validate.py` **reparieren** (skript-relative Pfade statt `/mnt/...`-Hardcode), `npm run validate` bleibt erhalten.
- **D-13:** `assets/styles-purged.css` **löschen** — wird von nichts konsumiert (kein Verweis in build.py, loader.js oder index.html; nur das gelöschte Generator-Skript schrieb sie).

### Doku- & Lizenz-Audit (STAB-10, STAB-11)
- **D-14:** CLAUDE.md (1.715 Zeilen): **Faktenkorrektur** — alle nachweislich falschen Aussagen korrigieren: Inline-Handler-Zahl (0 statt „~146 verbleiben"), tote Datei-Verweise (`features/network/mindmap.js`, `features/shops/spell-editor.js`), Campaign-Index-Key (`dnd-tracker-campaigns` statt `dnd-campaign-index`), Mindmap-Abschnitte entfernen, Roadmap-Tabelle aktualisieren, Version 2.6.1. Struktur und historische Kapitel bleiben. Gleiches Vorgehen für README und docs/bugfixes.md („Known Technical Debt"-Abschnitt).
- **D-15:** execCommand-Konvention: **an Realität anpassen** — die Doku beschreibt den Ist-Zustand (21+ Call-Sites in rich-text.js u.a., API deprecated); die Ablösung wird als bekannte Tech-Debt dokumentiert. Kein Code-Umbau in dieser Phase.
- **D-16:** SRD-Zaubertexte (Repo öffentlich: github.com/retroArthur/DnD_Tracker_Pro): **Dokumentieren + Attribution** — Befund (Quelle, Lizenz, Risikobewertung) in docs/ festhalten; fehlende Pflicht-Attribution (z.B. CC-BY-4.0 für SRD 5.1) in README/LICENSE ergänzen. Ein hartes Risiko (geschützte Übersetzung) wird als eigene Folge-Entscheidung eskaliert — nicht still Texte löschen.
- **D-17:** Lizenz-Feld `package.json`: ISC → **MIT** (Konsistenz mit LICENSE-Datei; durch STAB-10 fixiert).

### Claude's Discretion
- **CI-Smoke-Test-Umfang (STAB-08):** Boot-Check vs. Tab-Sweep, ob die CI den dist-Build selbst baut — beim Planen entscheiden. (Bereich wurde bewusst nicht diskutiert.)
- **build.py-Härtung (STAB-07):** Ansatz für Pass-3 (Fix vs. Pre-Build-Duplikat-Check), Umsetzung des Modullisten-Sync-Checks und des DEBUG_MODE-Abbruchs.
- Tote Dateien (main.js, tsconfig.json.backup, MIGRATION_REPORT.md) und `python3`→`python` in npm-Scripts (STAB-09).
- Implementierungsdetails: LS-Timestamp-Mechanik (Begleit-Key vs. Wrapper), Dialog-Gestaltung, exakte Event-Log-/Toast-Texte.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Befund-Inventar (Primärquelle dieser Phase)
- `.planning/codebase/CONCERNS.md` — Vollständiges Schwächen-Inventar mit Datei:Zeile-Angaben: Stale-Shadow-Bug-Mechanik, '2.11'-Export-Bug, Mindmap-Reste-Liste, CLAUDE.md-Falschaussagen, build.py-Pass-3-Problem, kaputte Tools, Lizenz-Mismatch
- `.planning/codebase/TESTING.md` — Test-Infrastruktur-Stand (für STAB-08 Smoke-Test und D-04 Unit-Test)

### Bestehende Bug-/Fehler-Doku (Audit-Ziele + Kontext)
- `docs/bugfixes.md` — Bug-Patterns; der „Known Technical Debt"-Abschnitt ist selbst Audit-Ziel (D-14)
- `docs/e2e-failure-triage.md` — E2E-Failure-Cluster (Kontext für Smoke-Test-Design, STAB-08)
- `CLAUDE.md` — Audit-Ziel (D-14); enthält zugleich die Build-System-Doku (Three-Pass-Dedup) für STAB-07

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- IndexedDB-Save stempelt bereits Timestamps: `saveToIndexedDBFallback()` schreibt `{id, data, timestamp: Date.now()}` (systems/spellslots/persistence.js:71-84) — nur die LS-Seite braucht einen Begleit-Zeitstempel
- Event-Log-System (`showToast`, `toggleEventLog` in utils/utilities.js) — Träger für D-02/D-03/D-08-Hinweise
- Migrations-System: `migrateData()` + `compareVersions()` (systems/spellslots/quick-roll.js:63-72, systems/spellslots/version-migration.js) — Andockpunkt für D-05 (Legacy-Stempel) und D-09 (Mindmap-Strip-Migration)
- `StorageAPI`-Wrapper liefert Fehler-Results (`{success, error}`) — Quota-Fehler-Erkennung vorhanden
- Auto-Backups gehen bereits primär nach IndexedDB (systems/backups.js:14-42) — kein Handlungsbedarf bei >5MB

### Established Patterns
- Save-Pfad: `systems/spellslots/persistence.js` (LS_LIMIT_MB=5, LS_WARNING_MB=4, IDB-only ab >5MB, optionales IDB-Mirror ab >2MB)
- Load-Pfad: `systems/spellslots/quick-roll.js:31-45` — liest LS zuerst, IDB nur `if (!s)` ← exakt hier sitzt der Stale-Shadow-Bug
- Build-Dedup-Regeln: keine `const X = window.X` in Funktionen, keine doppelten Top-Level-Funktionsnamen (CLAUDE.md Build-Abschnitt)
- Modullisten doppelt gepflegt: loader.js:10-124 + build.py:249-355 — debug.js steht in beiden (loader.js:120, build.py:353); jede Modul-Änderung synchron halten

### Integration Points
- Boot-Crash: `tools/debug.js:99` (`const clearAllNodes = clearMindmap;`)
- Mindmap-Seed: `systems/campaign-manager/campaign-manager.js:35`
- Mindmap-Kompat-Reads: `systems/backups.js`, `systems/spellslots/import-export.js` (werden zur Smart-Strip-Logik)
- Mindmap-Typen: `types/globals.d.ts`, `types/entities.d.ts`; Test-Reste: `tests/setup.js`, `tests/unit/stability.test.js`
- Export-Stempel: `systems/spellslots/quick-roll.js:133` (`exp._version = '2.11'`)
- Lizenz: `package.json:46` (ISC→MIT)

</code_context>

<specifics>
## Specific Ideas

- **Spieltisch-Tauglichkeit ist Leitlinie:** Keine wiederholten Toasts während des Spielabends — Hinweise einmalig pro Sitzung bzw. ins Event-Log. Fehler mit Datenverlust-Risiko müssen dagegen laut sein (Toast + Export-Aufforderung).
- **Kein stiller Datenverlust, nirgends:** Bei Ambiguität (Erstlade-Konflikt D-07, echte Mindmap-Inhalte D-09) entscheidet der Nutzer per Dialog — niemals eine stille Heuristik.
- Durchgängig deutsche UI-Texte für alle neuen Dialoge und Hinweise.

</specifics>

<deferred>
## Deferred Ideas

- **execCommand-Ablösung** im Rich-Text-Editor (21+ Call-Sites) — als Tech-Debt dokumentiert (D-15), eigene Phase
- **CLAUDE.md-Verschlankung** (historische Kapitel nach docs/ auslagern) — bewusst nicht in dieser Phase (D-14: nur Faktenkorrektur)
- **debug.js aus dem Production-Build nehmen** (Dev-only-Module in build.py) — bewusst nicht in dieser Phase (D-11: nur Reparatur)

</deferred>

---

*Phase: 01-stabilisierung*
*Context gathered: 2026-06-12*
