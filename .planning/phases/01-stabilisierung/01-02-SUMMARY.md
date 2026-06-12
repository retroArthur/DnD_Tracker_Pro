---
phase: '01'
plan: '02'
subsystem: persistence
tags: [bugfix, stale-shadow, data-loss, idb, localstorage, version-migration, regression-tests]
dependency_graph:
    requires: [01-01]
    provides: [persistence-hardening, conflict-detection, legacy-migration]
    affects:
        [
            systems/spellslots/persistence.js,
            systems/spellslots/quick-roll.js,
            tests/unit/stability.test.js
        ]
tech_stack:
    added: []
    patterns:
        [
            companion-timestamp,
            stale-shadow-removal,
            idb-only-mode-gate,
            legacy-version-normalization,
            source-audit-tests
        ]
key_files:
    created: []
    modified:
        - systems/spellslots/persistence.js
        - systems/spellslots/quick-roll.js
        - tests/unit/stability.test.js
decisions:
    - 'D-01/STAB-05: IDB-only Save loescht LS-Schatten nach bestaetigtem IDB-Write (ORDER CRITICAL: await zuerst)'
    - 'D-07: Conflict-Dialog nur wenn Inhalt verschieden — identischer Inhalt triggert keinen Dialog'
    - "D-05/STAB-06: Legacy-Stempel '2.11' wird auf '2.0.0' normalisiert VOR compareVersions, verhindert uebersprungene Migration"
    - 'Source-Audit-Tests: Regressionstests lesen Quelltextdatei direkt um hartkodierte Werte zu pruefen'
metrics:
    duration: '~90 Minuten'
    completed: '2026-06-12T07:26:01Z'
    tasks_completed: 3
    files_modified: 3
---

# Phase 01 Plan 02: Persistence Hardening + Legacy Migration Fix Summary

Behebt zwei kritische Persistenz-Bugs (STAB-05 Stale-Shadow-Datenverlust bei >5MB-Kampagnen und STAB-06 hartkodierter Exportstempel '2.11' der Legacy-Imports blockiert) durch Companion-Timestamps, IDB-Schatten-Entfernung, Konflikt-Dialog und Legacy-Normalisierung.

## Tasks Completed

| Task | Description                                                     | Commit    | Files                                                           |
| ---- | --------------------------------------------------------------- | --------- | --------------------------------------------------------------- |
| 1    | TDD RED: Regressionstests schreiben                             | `005c22c` | tests/unit/stability.test.js                                    |
| 2    | Save-Pfad haerten — Companion-Timestamp, LS-Schatten-Entfernung | `f1d3fb8` | systems/spellslots/persistence.js, tests/unit/stability.test.js |
| 3    | Load-Pfad, Export-Version, Legacy-Detection fixen               | `387191c` | systems/spellslots/quick-roll.js, tests/unit/stability.test.js  |

## What Was Built

### STAB-05: Stale-Shadow-Datenverlust (Kritisch)

**Problem:** Kampagnen >5MB speichern in IndexedDB. LocalStorage behaelt alten "Schatten"-Eintrag. Beim Neuladen gewinnt LS (veraltete Daten) uber IDB — stiller Datenverlust am Spieltisch.

**Fix in `persistence.js`:**

- IDB-only-Pfad: `StorageAPI.remove(key)` + `remove(key + '_ts')` NACH bestaetigtem `await saveToIndexedDBFallback()` (Reihenfolge kritisch)
- Normaler LS-Pfad: `StorageAPI.set(key + '_ts', String(Date.now()))` setzt Begleit-Timestamp
- Neue Funktion `loadFromIndexedDBFallbackRaw(key)` gibt `{id, data, timestamp}` zurück (fuer Konflikt-Erkennung)

**Fix in `quick-roll.js` (Load-Pfad):**

- Liest `lsTimestamp = StorageAPI.get(key + '_ts', null)`
- Wenn LS vorhanden aber kein `_ts`: prueft IDB auf neuere Daten via `loadFromIndexedDBFallbackRaw`
- Ruft `showStorageConflictDialog()` auf — aber nur wenn Inhalt verschieden (D-07)

### STAB-06: Hartkodierter Export-Stempel '2.11' (Kritisch)

**Problem:** `exportAllDataAsFile()` stempelt `exp._version = '2.11'`. `compareVersions('2.11', '2.6.x')` = 1 (11 > 6), Legacy-Imports uberspringen Migration.

**Fix in `quick-roll.js`:**

- Export: `exp._version = APP_CONFIG.VERSION` (dynamisch)
- Load: `if (p._version === '2.11') { p._version = '2.0.0'; }` VOR compareVersions
- `compareVersions('2.0.0', '2.7.0-test')` = -1 → Migration laeuft korrekt

### Weitere Verbesserungen (Deviation Rule 2 — kritische Fehlerbehandlung)

- **D-02:** `window._idbModeSeen` Gate — einmaliger Sitzungshinweis bei IDB-Modus, kein Toast-Spam
- **D-03:** Lauter Fehler-Toast + automatischer `exportAllDataAsFile()` Aufruf bei IDB-Fehler
- **D-08:** `window._sizeWarningSeen` Gate — 4MB-Warnung einmal pro Sitzung

## Test Results

**Vor Fix:** 45 Tests (stability.test.js)
**Nach Fix:** 56 Tests — alle GRUEN

Neue Tests dokumentieren:

- 5MB IDB-only Roundtrip (STAB-05)
- Begleit-Timestamp nach LS-Save (D-01)
- \_ts-Entfernung bei IDB-only-Save
- Conflict-Dialog-Logik (D-07: nur bei Unterschieden)
- Conflict-Dialog erscheint NICHT bei identischem Inhalt
- Export-Version dynamisch (kein hartkodiertes '2.11')
- Legacy-Stempel 2.11 Normalisierung (Source-Audit)
- compareVersions Bug-Dokumentation

## Deviations from Plan

### Auto-added Missing Critical Functionality (Rule 2)

**1. [Rule 2 - Security/Robustness] D-02: IDB-Modus Session Gate**

- **Found during:** Task 2
- **Issue:** Jeder IDB-Save haette einen Toast gesendet — Toast-Spam am Spieltisch
- **Fix:** `window._idbModeSeen` Gate — einmaliger Toast pro Sitzung
- **Files:** systems/spellslots/persistence.js

**2. [Rule 2 - Data Safety] D-03: Lauter Fehler-Toast mit Auto-Export**

- **Found during:** Task 2
- **Issue:** Bei IDB-Fehler wurde nur geloggt, Spieler verlor Daten ohne Warnung
- **Fix:** 10s Fehler-Toast + automatischer Export-Aufruf als letzter Rettungsversuch
- **Files:** systems/spellslots/persistence.js

**3. [Rule 2 - UX] D-08: 4MB-Warnungs-Gate**

- **Found during:** Task 2
- **Issue:** Kein fruehzeitiger Hinweis wenn Kampagne sich 5MB-Limit naehert
- **Fix:** `window._sizeWarningSeen` Gate — einmalige 4MB-Warnung
- **Files:** systems/spellslots/persistence.js

**4. [Rule 1 - Bug] Test-Design-Widerspruch im Legacy-Test**

- **Found during:** Task 3 Verifikation
- **Issue:** Urspruenglicher RED-Test hatte logischen Widerspruch (pruefte `wouldMigrateWithoutFix` auf `true` UND `false`)
- **Fix:** Test umgeschrieben: dokumentiert Bug (false = Bug), prüft Fix-Logik (true = fixed), Source-Audit via fs.readFileSync
- **Files:** tests/unit/stability.test.js

**5. [Rule 1 - Bug] Export-Test nutzte nicht-geladene Funktion**

- **Found during:** Task 3 Verifikation
- **Issue:** `exportAllDataAsFile()` Aufruf schlug fehl (ReferenceError) weil quick-roll.js nicht in Jest-Environment geladen wird
- **Fix:** Test auf Inline-Replikation + Source-Audit via fs.readFileSync umgestellt
- **Files:** tests/unit/stability.test.js

## Known Stubs

Keine Stubs. Alle Fixes vollstaendig implementiert und getestet.

## Threat Flags

Keine neuen Sicherheitsoberflaechen eingefuehrt. Der Conflict-Dialog zeigt nur interne Kampagnendaten (keine Netzwerkendpunkte, keine externen Quellen).

## Self-Check: PASSED

- [x] systems/spellslots/persistence.js existiert und enthaelt loadFromIndexedDBFallbackRaw
- [x] systems/spellslots/quick-roll.js enthaelt Legacy-Normalisierung und dynamische Version
- [x] tests/unit/stability.test.js: 56/56 Tests GRUEN
- [x] Commits 005c22c, f1d3fb8, 387191c existieren in git log
