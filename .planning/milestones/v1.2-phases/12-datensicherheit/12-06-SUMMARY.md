---
phase: 12-datensicherheit
plan: 06
subsystem: soundboard
tags: [undo-redo, indexeddb, tombstone-delete, data-integrity, jest, playwright]

# Dependency graph
requires:
  - phase: 12-datensicherheit (12-05)
    provides: "registerUndoHook()/_notifyUndoHooks() in systems/undo.js — Konsument dieses Plans"
provides:
  - "features/soundboard/soundboard-idb.js: softDeleteSoundBlob()/restoreSoundBlob() — Grabstein statt Sofortloeschung"
  - "features/soundboard/soundboard-idb.js: listSoundBlobs() filtert Grabsteine; Sitzungs-Aufraeumen entfernt Grabsteine frueherer Sitzungen"
  - "features/soundboard/soundboard-crud.js: removeAudioFile() ruft saveUndoState() vor jeder Mutation; Undo-Hook _onUndoAudioDelete() stellt Blob bei Strg+Z wieder her"
affects: []

# Actuals (#2632)
actuals:
  tokens: 7863
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Aufgeschobenes Loeschen (Tombstone/Grabstein-Pattern) fuer IndexedDB-Inhalte, die saveUndoState() nicht erfassen kann (nur window.D wird gesnapshottet, nie IDB) — get()+put() innerhalb derselben Transaktion statt delete()"
    - "Modul-Journal (_audioDeleteJournal) als Bruecke zwischen dem generischen Undo-Aktionslabel ('Audio entfernt') und der konkreten zuletzt betroffenen IDB-id — LIFO bei Undo, FIFO unter den bereits wiederhergestellten Eintraegen bei Redo"
    - "Sitzungs-Aufraeumen einmalig beim ersten Aufruf einer Lese-Funktion (listSoundBlobs()) statt per Timer/Intervall — Undo-Stack lebt nur im Speicher, ist nach jedem Reload leer, daher ist jeder Grabstein einer frueheren Sitzung garantiert unerreichbar"

key-files:
  created: []
  modified:
    - features/soundboard/soundboard-idb.js
    - features/soundboard/soundboard-crud.js
    - tests/unit/soundboard.test.js
    - tests/e2e/features/soundboard.spec.js

key-decisions:
  - "Deferred Deletion statt der von der Recherche vorgeschlagenen Scope-Reduktion (nur Referenz benennen) — der Plan-Checker verwarf 'nur den fehlenden Dateinamen anzeigen' explizit, weil das genau die 'defekten Szenen' hinterlassen haette, die SAFE-03 verhindern soll"
  - "deleteSoundBlob() bleibt eine harte, sofortige Loeschung — nur removeAudioFile() (UI-Loeschpfad) nutzt softDeleteSoundBlob(); das haelt die bestehende E2E-Suite und das Sitzungs-Aufraeumen unveraendert funktionsfaehig"
  - "Undo-Hook reagiert ausschliesslich auf das Aktionslabel 'Audio entfernt' — jeder andere Undo/Redo-Vorgang (Charakter loeschen, Beziehung entfernen, ...) laesst die Audio-Datenbank unberuehrt"
  - "E2E-Test zusaetzlich zum Plan-Scope ergaenzt (tests/e2e/features/soundboard.spec.js), weil dies der letzte Plan der Phase ist, der das Roadmap-Erfolgskriterium 'Strg+Z stellt Blob UND Szenen-Referenz wieder her' tatsaechlich erfuellt — Unit-Tests mit Spies beweisen nur die Aufrufreihenfolge, nicht den echten Browser-Rundlauf durch IndexedDB/localStorage"

patterns-established:
  - "Grabstein-Pattern (deletedAt-Feld + Filter in der Leseabfrage + einmaliges Session-Aufraeumen) als wiederverwendbares Muster fuer jeden zukuenftigen IDB-Store, dessen Loeschung ueber saveUndoState() rueckgaengig machbar sein soll"

requirements-completed: [SAFE-03]

coverage:
  - id: D1
    description: "softDeleteSoundBlob() versieht den Eintrag mit einem Grabstein; listSoundBlobs() liefert ihn danach nicht mehr, getSoundBlob() weiterhin unveraendert"
    requirement: "SAFE-03"
    verification:
      - kind: unit
        ref: "tests/unit/soundboard.test.js#softDeleteSoundBlob(): Eintrag verschwindet aus listSoundBlobs(), bleibt aber via getSoundBlob() ladbar"
        status: pass
    human_judgment: false
  - id: D2
    description: "restoreSoundBlob() entfernt den Grabstein, der Eintrag erscheint mit unveraendertem Namen/Typ/Groesse wieder in listSoundBlobs(); auf unbekannte id liefert es false statt zu werfen"
    requirement: "SAFE-03"
    verification:
      - kind: unit
        ref: "tests/unit/soundboard.test.js#restoreSoundBlob(): Eintrag erscheint wieder in listSoundBlobs(), Name/Typ/Groesse unveraendert"
        status: pass
      - kind: unit
        ref: "tests/unit/soundboard.test.js#restoreSoundBlob() auf eine unbekannte id liefert false und wirft nicht"
        status: pass
    human_judgment: false
  - id: D3
    description: "deleteSoundBlob() loescht weiterhin sofort und endgueltig (unveraendert); ein Grabstein vor Sitzungsstart wird beim ersten listSoundBlobs() endgueltig entfernt, einer der laufenden Sitzung bleibt erhalten"
    requirement: "SAFE-03"
    verification:
      - kind: unit
        ref: "tests/unit/soundboard.test.js#deleteSoundBlob() loescht weiterhin sofort und endgueltig (unveraendert)"
        status: pass
      - kind: unit
        ref: "tests/unit/soundboard.test.js#Sitzungs-Aufraeumen: Grabstein vor Sitzungsstart wird beim ersten listSoundBlobs() endgueltig entfernt, Grabstein der laufenden Sitzung bleibt"
        status: pass
    human_judgment: false
  - id: D4
    description: "removeAudioFile() ruft saveUndoState('Audio entfernt') als erste wirksame Anweisung, vor softDeleteSoundBlob() und vor jeder Szenen-Mutation; nutzt softDeleteSoundBlob(), nicht deleteSoundBlob()"
    requirement: "SAFE-03"
    verification:
      - kind: unit
        ref: "tests/unit/soundboard.test.js#removeAudioFile(): saveUndoState laeuft VOR softDeleteSoundBlob und vor der Szenen-Mutation (save())"
        status: pass
      - kind: unit
        ref: "tests/unit/soundboard.test.js#removeAudioFile(): verwendet softDeleteSoundBlob, nicht deleteSoundBlob"
        status: pass
    human_judgment: false
  - id: D5
    description: "Undo-Hook stellt bei { action: 'Audio entfernt', direction: 'undo' } die zuletzt entfernte Datei wieder her; zwei aufeinanderfolgende Entfernungen werden in umgekehrter Reihenfolge (LIFO) wiederhergestellt; Redo versieht dieselbe Datei erneut mit einem Grabstein; ein fremdes Aktionslabel laesst die Datenbank unberuehrt"
    requirement: "SAFE-03"
    verification:
      - kind: unit
        ref: "tests/unit/soundboard.test.js#Undo-Hook stellt bei { action: \"Audio entfernt\", direction: \"undo\" } genau die zuletzt entfernte Datei wieder her"
        status: pass
      - kind: unit
        ref: "tests/unit/soundboard.test.js#Zwei aufeinanderfolgende Entfernungen werden in umgekehrter Reihenfolge wiederhergestellt"
        status: pass
      - kind: unit
        ref: "tests/unit/soundboard.test.js#Redo versieht dieselbe Datei wieder mit einem Grabstein (softDeleteSoundBlob)"
        status: pass
      - kind: unit
        ref: "tests/unit/soundboard.test.js#Ein Hook-Aufruf mit einem anderen Aktionslabel laesst die Datenbank unberuehrt"
        status: pass
    human_judgment: false
  - id: D6
    description: "Roadmap-Erfolgskriterium in einer echten Browser-Session: Strg+Z nach dem Entfernen einer Audiodatei (echter Remove-Button-Klick) stellt Blob UND Szenen-Referenz wieder her — und ueberlebt einen Seiten-Reload (echte IDB/localStorage-Persistenz, nicht nur In-Memory-Zustand)"
    requirement: "SAFE-03"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/soundboard.spec.js#undo after removing audio file restores blob and scene reference"
        status: pass
    human_judgment: false

# Metrics
duration: ~35min
completed: 2026-08-19
status: complete
---

# Phase 12 Plan 06: Grabstein-Löschung fürs Soundboard Summary

**`removeAudioFile()` löscht Audiodateien jetzt aufgeschoben (Grabstein statt Sofortlöschung) und sichert vorher per `saveUndoState()` — `Strg+Z` stellt dadurch sowohl die Szenen-Referenz als auch die Datei selbst wieder her, bewiesen bis in eine echte Browser-Session inklusive Reload.**

## Performance

- **Duration:** ~35 min
- **Started:** im Anschluss an 12-05
- **Completed:** 2026-08-19
- **Tasks:** 2
- **Files modified:** 4 (2 Produktionsdateien, 1 Unit-Testdatei, 1 E2E-Testdatei zusätzlich zum Plan-Scope)

## Accomplishments

- `softDeleteSoundBlob(id)`/`restoreSoundBlob(id)` in `soundboard-idb.js`: Der Blob wird bei einer Löschung nicht mehr entfernt, sondern nur mit `deletedAt` markiert. `listSoundBlobs()` filtert Grabsteine heraus (Bibliothek und Szenenliste sehen die entfernte Datei sofort nicht mehr), `getSoundBlob()` bleibt unverändert und liefert sie weiterhin — genau das macht die Wiederherstellung überhaupt erst möglich.
- Sitzungs-Aufräumen: Beim ersten `listSoundBlobs()`-Aufruf einer Sitzung werden alle Grabsteine entfernt, deren `deletedAt` vor dem Start der laufenden Sitzung liegt — endgültig, per `deleteSoundBlob()`. Der Undo-Stack lebt nur im Speicher und ist nach jedem Neuladen leer, also ist ein Grabstein einer früheren Sitzung durch kein `Strg+Z` mehr erreichbar.
- `removeAudioFile()` in `soundboard-crud.js` ruft `window.saveUndoState('Audio entfernt')` jetzt als erste wirksame Anweisung — vorher fehlte der Undo-Push komplett (Verstoß gegen die CLAUDE.md-Regel "immer `saveUndoState()` vor destruktiven Operationen"). Nutzt `softDeleteSoundBlob()` statt `deleteSoundBlob()`.
- Ein Modul-Journal (`_audioDeleteJournal`) verbindet das generische Undo-Aktionslabel `'Audio entfernt'` mit der konkreten zuletzt betroffenen Blob-`id`. Der über `registerUndoHook()` (Plan 12-05) registrierte Hook `_onUndoAudioDelete()` stellt bei Undo die zuletzt entfernte Datei wieder her (LIFO), bei Redo versieht er sie erneut mit einem Grabstein (FIFO unter den bereits wiederhergestellten Einträgen). Ein fremdes Aktionslabel (z. B. `'Charakter gelöscht'`) lässt die Audio-Datenbank unberührt.
- Zusätzlich zum Plan-Scope: ein neuer E2E-Test in `tests/e2e/features/soundboard.spec.js` klickt den echten Remove-Button, drückt `Strg+Z` und prüft — inklusive Seiten-Reload danach — dass sowohl der Blob (`listSoundBlobs()`) als auch die Szenen-Referenz (`D.soundboard.scenes`) zurück sind. Das beweist das Roadmap-Erfolgskriterium der Phase in einer echten Browser-Session, nicht nur über Spies.

## Task Commits

Each task was committed atomically:

1. **Task 1: Grabstein-Löschung in soundboard-idb.js** - `509ee8f` (feat)
2. **Task 2: removeAudioFile() sichert vorher, Undo-Hook holt Datei zurück** - `f3aa247` (feat)

**Plan metadata:** commit pending (docs: complete plan)

## Files Created/Modified

- `features/soundboard/soundboard-idb.js` - `softDeleteSoundBlob()`, `restoreSoundBlob()`, `_cleanupStaleTombstones()`, Grabstein-Filter in `listSoundBlobs()`; `deleteSoundBlob()`/`getSoundBlob()` unverändert
- `features/soundboard/soundboard-crud.js` - `saveUndoState()` vor jeder Mutation in `removeAudioFile()`; `_audioDeleteJournal`; Undo-Hook `_onUndoAudioDelete()` registriert über `window.registerUndoHook`
- `tests/unit/soundboard.test.js` - 11 neue Jest-Tests: 5 für die IDB-Grabstein-Mechanik (eigener In-Memory-IDB-Mock mit `get`/`getAll`/`put`/`delete` und `tx.oncomplete`-Sequenzierung, erweitert gegenüber der `setupMockIDB()`-Vorlage aus `stability.test.js`), 6 für `removeAudioFile()`-Reihenfolge/Undo/Redo/fremdes Label (frisches `eval()` von `soundboard-crud.js` pro Test mit Spies)
- `tests/e2e/features/soundboard.spec.js` - 1 neuer E2E-Test (`undo after removing audio file restores blob and scene reference`), zusätzlich zum Plan-Scope

## Decisions Made

- **Deferred Deletion statt Scope-Reduktion:** Die Recherche hatte den Blob-Verlust nach Undo als architektonische Grenze deklariert (`saveUndoState()` snapshottet nur `window.D`, nie IndexedDB) und vorgeschlagen, nach Undo nur den fehlenden Dateinamen zu benennen statt ihn wiederherzustellen. Der Plan-Checker verwarf das explizit als Scope-Reduktion — es hätte genau die "defekten Szenen" hinterlassen, die SAFE-03 verhindern soll. Stattdessen: aufgeschobenes Löschen (Grabstein), sodass der Blob bei Undo tatsächlich zurückgeholt werden kann.
- **`deleteSoundBlob()` bleibt hart:** Nur der UI-Löschpfad (`removeAudioFile()` → `softDeleteSoundBlob()`) ist aufgeschoben. Das Sitzungs-Aufräumen und die bestehende E2E-Suite verlassen sich weiterhin auf eine echte, sofortige Löschung über `deleteSoundBlob()` — daran wurde bewusst nichts geändert.
- **Hook reagiert nur auf `'Audio entfernt'`:** Jeder andere Undo/Redo-Vorgang lässt die Audio-Datenbank unberührt — verifiziert über einen expliziten Test mit fremdem Aktionslabel.
- **E2E-Test über den Plan-Scope hinaus ergänzt:** Da dies der letzte Plan der Phase ist, der das Roadmap-Erfolgskriterium 3 ("Strg+Z nach dem Löschen einer Audiodatei stellt Blob UND Szenen-Referenz wieder her") tatsächlich erfüllt, reichte die Unit-Test-Abdeckung mit Spies nicht aus, um das ehrlich zu belegen — Spies beweisen nur Aufrufreihenfolge, nicht den echten IndexedDB/localStorage-Rundlauf. Der neue Test klickt den echten `.sb-remove-btn`, drückt `Strg+Z` über die reale Tastatur-Kürzel-Verdrahtung (`systems/spellslots/keyboard-shortcuts.js`) und prüft zusätzlich nach einem Seiten-Reload — dieselbe Vorsicht wie beim bestehenden "audio blob persists after reload"-Test, um zu verhindern, dass ein In-Memory-JS-Zustand (z. B. `soundboard-player.js:_bufferCache`) einen kaputten Restore als funktionierend erscheinen lässt. Getestet wird die Datenebene (Metadaten + Szenen-Referenz), nicht echte Audio-Wiedergabe — wie bei allen anderen Tests dieser Datei, da die synthetische WAV-Testdatei 0 Samples hat und sich nicht dekodieren lässt (Audio-Ausgabe ist laut Datei-Kommentar ohnehin manuell zu prüfen).

## Deviations from Plan

**1. [Rule 2 - Fehlende kritische Verifikation ergänzt] E2E-Test für den echten Undo-Rundlauf zusätzlich zum Plan-Scope**
- **Gefunden während:** Verifikationsphase nach Task 2
- **Issue:** Der Plan listet nur `tests/unit/soundboard.test.js` in `files_modified`. Das Roadmap-Erfolgskriterium der Phase ("Strg+Z stellt Blob UND Szenen-Referenz wieder her") lässt sich mit Spy-basierten Unit-Tests aber nur indirekt beweisen (Aufrufreihenfolge, nicht der tatsächliche IndexedDB/localStorage-Rundlauf in einer echten Browser-Session).
- **Fix:** Ein neuer E2E-Test in `tests/e2e/features/soundboard.spec.js` (bestehende, bereits abgedeckte Testdatei) klickt den echten Remove-Button, löst `Strg+Z` aus und prüft Blob + Szenen-Referenz — sowohl direkt danach als auch nach einem Seiten-Reload.
- **Files modified:** `tests/e2e/features/soundboard.spec.js`
- **Commit:** `f3aa247` (zusammen mit Task 2, da inhaltlich zu dessen Verhalten gehörig)

Kein Scope-Deviation im Sinne einer Architekturänderung — reine Test-Ergänzung, die das bereits geplante Verhalten stärker belegt.

---

**Total deviations:** 1 (Test-Ergänzung, kein Verhaltens- oder Architektur-Deviation)
**Impact on plan:** Keine funktionale Abweichung vom Plan. Alle `must_haves` (Undo-Zustand vor Entfernen, Wiederherstellung von Referenz UND Datei, sofortiges Verschwinden, Grabstein-Aufräumen, benannte fehlende Datei bei Wiedergabe) sind erfüllt und über Unit- UND E2E-Tests belegt.

## Issues Encountered

Keine. Beide Tasks liefen ohne Blocker durch; alle in `<verify>` geforderten Testläufe waren beim ersten Durchlauf grün.

## User Setup Required

None - no external service configuration required.

## Verification Summary

- `npx jest tests/unit/soundboard.test.js tests/unit/soundboard-loop.test.js tests/unit/stability.test.js` — 102/102 grün
- `npx jest` (volle Unit-Suite) — **705/705 grün** (Baseline 694 + 11 neue Tests)
- `python -m pytest tests/build` — **24/24 grün** (Baseline gehalten)
- `node --check` auf beiden geänderten Soundboard-Produktionsdateien — beide fehlerfrei
- `PYTHONIOENCODING=utf-8 python build.py` — Build erfolgreich, 124/124 Module, keine Duplikat-Deklarationsfehler
- `npx playwright test` (volle E2E-Suite) — **320 passed / 2 skipped** (Baseline 319 passed/2 skipped + 1 neuer Test), keine Regression
- Neuer E2E-Test `undo after removing audio file restores blob and scene reference` beweist das Roadmap-Erfolgskriterium end-to-end inklusive Seiten-Reload

## Known Stubs

Keine.

## Threat Flags

Keine neue Angriffsfläche eingeführt — die Änderungen bleiben innerhalb der bestehenden Vertrauensgrenze "Nutzeraktion 'Entfernen' → IndexedDB", die im Plan-Threat-Model bereits erfasst ist (T-12-19/T-12-20 mitigiert, T-12-21 als bereits abgedeckt akzeptiert).

## Next Phase Readiness

- SAFE-03 ist mit diesem Plan vollständig erfüllt (funktional UND end-to-end verifiziert).
- Grabstein-Pattern (`deletedAt` + Filter + Sitzungs-Aufräumen) ist als wiederverwendbares Muster etabliert für jeden zukünftigen IndexedDB-Store, dessen Löschung über `saveUndoState()` rückgängig machbar sein soll.
- Phase 12 hat noch Plan 12-07 offen (laut STATE.md: 7 Pläne gesamt, dieser Plan war 6 von 7).

---
*Phase: 12-datensicherheit*
*Completed: 2026-08-19*

## Self-Check: PASSED

All created/modified files verified present on disk; both task commits (`509ee8f`, `f3aa247`) verified present in git log; unit suite (705/705), pytest (24/24), and full Playwright suite (320 passed/2 skipped) all green at time of writing.
