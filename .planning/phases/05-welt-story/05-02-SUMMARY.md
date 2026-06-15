---
phase: 05-welt-story
plan: "02"
subsystem: welt-story-tabellen
tags: [npc-generator, reise, wetter, build-time-script, german-content, wave-1]
dependency_graph:
  requires:
    - 11-feature-module-skeletons  # von Plan 05-01
    - npc-default-tables-skeleton
    - reise-default-tables-skeleton
  provides:
    - NPC_DEFAULT_TABLES-populated  # 505 Einträge, 7 Völker
    - REISE_BEGEGNUNGS_TABELLEN-populated  # 48 Einträge, 6 Gelände
    - WETTER_TABELLEN-populated  # 32 Einträge, gemässigt × 4 Jahreszeiten
    - generate_npc_tables-script
    - generate_reise_tables-script
  affects:
    - features/npc-generator/npc-default-tables.js
    - features/reise/reise-default-tables.js
tech_stack:
  added: []
  patterns:
    - Build-Time-Python-Generator (script-relative Pfade, UTF-8-Ausgabe)
    - Idempotente JS-Datei-Erzeugung via Python-Dicts
    - rollWeightedEntry-kompatibles {range, text}-Format für 1W8-Tabellen
    - String-Array-Muster für NPC-Namen (Math.random()-Index-Zugriff)
key_files:
  created:
    - tools/generate_npc_tables.py
    - tools/generate_reise_tables.py
  modified:
    - features/npc-generator/npc-default-tables.js
    - features/reise/reise-default-tables.js
decisions:
  - "Build-Time-Python-Skripte statt Hand-Tippen (Lektion Phase 3: 32k-Output-Limit)"
  - "NPC-Namen als einfache String-Arrays (Math.random()-Index), nicht als rollWeightedEntry-Tabellen — Plan verlangt kein Gewichtungs-Schema für Namen"
  - "REISE_GELÄNDE und REISE_TEMPO als statische Inlines im generierten reise-default-tables.js (nicht als separate Konstanten) — Rückwärtskompatibilität mit Plan 05-01-Exporten"
  - "Validierungslogik in Python-Skripten selbst (Mindestmengen, Range-Lückenlosigkeit) — kein externes Test-Framework nötig"
metrics:
  duration_minutes: 5
  completed_date: "2026-06-15"
  tasks_total: 2
  tasks_completed: 2
  files_created: 2
  files_modified: 2
---

# Phase 05 Plan 02: Deutsche Default-Tabellen via Build-Time-Generator Summary

**One-liner:** Zwei Python-Build-Time-Generatoren erzeugen 585 deutsche Einträge (NPC-Namen/Züge/Marotten/Berufe/Aussehen + Geländebegegnungen + Saisonwetter) in reproduzierbaren JS-Konstanten — Build grün, node-Assertionen bestanden.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | tools/generate_npc_tables.py + npc-default-tables.js | 0daec18 | tools/generate_npc_tables.py, features/npc-generator/npc-default-tables.js |
| 2 | tools/generate_reise_tables.py + reise-default-tables.js, Build-Verifikation | 0c42103 | tools/generate_reise_tables.py, features/reise/reise-default-tables.js |

## What Was Built

### Task 1 — NPC-Tabellen-Generator

**tools/generate_npc_tables.py:**
- Python-Skript mit allen Rohdaten als Dicts/Listen
- Schreibt `features/npc-generator/npc-default-tables.js` mit UTF-8-Kodierung
- Script-relative Pfade via `os.path.dirname(os.path.abspath(__file__))`
- Interne Validierung: Mindestmengen-Prüfung vor Ausgabe
- Idempotent: jede Ausführung überschreibt sauber

**features/npc-generator/npc-default-tables.js (generiert):**
- 370 Namen für 7 Völker × Geschlechter:
  - Mensch: 40 männlich, 40 weiblich, 20 neutral
  - Elf: 25 männlich, 25 weiblich
  - Zwerg: 25 männlich, 25 weiblich
  - Halbling: 25 männlich, 25 weiblich
  - Halbork: 20 männlich, 20 weiblich
  - Tiefling: 20 männlich, 20 weiblich
  - Gnom: 20 männlich, 20 weiblich
- 30 Persönlichkeitszüge (setting-passend, Deutsch)
- 30 Marotten (verhaltens-/gewohnheitsbezogen)
- 45 Berufe (Handwerk, Handel, Abenteuer, Klerus, Kriminalität)
- 30 Aussehens-/Merkmals-Beschreibungen
- **Gesamt: 505 Einträge**

Format: `const NPC_DEFAULT_TABLES = {...}; window.NPC_DEFAULT_TABLES = NPC_DEFAULT_TABLES;`
Keine Top-Level-Funktionen (T-05-04 mitigiert).

### Task 2 — Reise-/Wetter-Tabellen-Generator + Build

**tools/generate_reise_tables.py:**
- Analog zu generate_npc_tables.py (selbes Muster: script-relativ, UTF-8, idempotent)
- Integrierte Validierung: Range-Lückenlosigkeit (1..8) + Mindestmengen
- Schreibt `features/reise/reise-default-tables.js`

**features/reise/reise-default-tables.js (generiert):**
- REISE_GELÄNDE: 5 Typen (statisch, unverändert)
- REISE_TEMPO: langsam/normal/schnell (statisch, unverändert)
- REISE_BEGEGNUNGS_TABELLEN: 6 Gelände × 8 Einträge (1W8, Ranges 1-8 lückenlos):
  - wald, gebirge, kueste, strasse, ruinen, sumpf
- WETTER_TABELLEN['gemässigt']: 4 Jahreszeiten × 8 Einträge (1W8, Ranges 1-8 lückenlos):
  - winter, fruehling, sommer, herbst
- **Gesamt: 80 neue Einträge** (48 Begegnungen + 32 Wetter)

Format: kompatibel mit `rollWeightedEntry(table)` in `features/random-tables.js`
Vier window-Exporte: REISE_GELÄNDE, REISE_TEMPO, REISE_BEGEGNUNGS_TABELLEN, WETTER_TABELLEN

**Build-Verifikation:**
- `python build.py` grün — 117 Module, keine Duplikate, keine SyntaxErrors
- Build-Größe: 2,640,965 Zeichen (2.52 MB)
- Dedup-Pass: 429 window-assignment-Konflikte bereinigt (normal, keine Regressions)

## Acceptance Gate Results

| Gate | Ergebnis |
|------|----------|
| `python generate_npc_tables.py` | BESTANDEN — 505 Einträge, keine Fehler |
| node-Assertion NPC-Tabellen | BESTANDEN — 7 Völker, persoenlichkeitszuege:30, marotten:30, berufe:45, aussehen:30 |
| `python generate_reise_tables.py` | BESTANDEN — 80 Einträge, Range-Validierung grün |
| node-Assertion Reise-Tabellen | BESTANDEN — 6 Gelände, 4 Jahreszeiten, alle ≥8 Einträge |
| `python build.py` | BESTANDEN — grün, 117 Module, keine SyntaxErrors |

## Deviations from Plan

**None** — Plan exakt wie spezifiziert ausgeführt.

Einzige Anmerkung: `REISE_GELÄNDE` und `REISE_TEMPO` wurden als statische Inlines in
`reise-default-tables.js` belassen (nicht neu generiert), da sie in Plan 05-01 bereits
funktional definiert worden waren und unverändert bleiben. Der Generator überschreibt die
gesamte Datei, schreibt diese Konstanten aber bit-identisch zurück — keine Verhaltensänderung.

## Known Stubs

| Stub | Datei | Grund |
|------|-------|-------|
| `NPC_DEFAULT_TABLES.namen.*.neutral` | npc-default-tables.js | Nur Mensch hat neutral-Einträge (20); andere Völker haben kein neutral-Array — Plan spezifiziert nur maennlich/weiblich für Nicht-Mensch |
| Nur gemässigtes Klima in WETTER_TABELLEN | reise-default-tables.js | Plan fordert nur gemässigt; arktisch/tropisch/wüste als spätere Erweiterung vorgesehen |

## Threat Flags

Keine neuen Netzwerk-Endpunkte oder Trust-Boundary-Überschreitungen.
T-05-04 (Tampering — generierte Datei enthält Code statt Daten): **mitigiert** —
beide generierten Dateien enthalten ausschließlich `const X = {literal}` + window-Export,
keine Top-Level-Funktionen. node-Assertion verifiziert reine Datenstruktur.

## Self-Check: PASSED

- tools/generate_npc_tables.py: existiert, läuft, erzeugt valide JS
- features/npc-generator/npc-default-tables.js: 505 Einträge, 7 Völker, keine Funktionen
- tools/generate_reise_tables.py: existiert, läuft, erzeugt valide JS
- features/reise/reise-default-tables.js: 80 Einträge, 6 Gelände, 4 Jahreszeiten
- Commits: 0daec18, 0c42103 — beide vorhanden
- `python build.py` grün (2.52 MB, 117 Module, Dedup OK)
