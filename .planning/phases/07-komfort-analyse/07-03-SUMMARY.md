---
phase: 07-komfort-analyse
plan: "03"
subsystem: soundboard-ui
tags: [soundboard, web-audio-ui, indexeddb, scene-crud, keyboard-shortcuts, e2e, xss-escape]

dependency_graph:
  requires:
    - phase: 07-01
      provides: IDB v4 audioBlobs store, soundboard skeleton modules, tab registry entry
    - phase: 07-02
      provides: saveSoundBlob/deleteSoundBlob/listSoundBlobs, activateSoundScene, stopAllTracks, toggleSoundboardMute
  provides:
    - importAudioFile (size-guard before IDB write, T-07-AUDIO-DOS)
    - removeAudioFile (with dangling blobId cleanup from scenes)
    - createScene / renameScene / deleteScene / addTrackToScene / removeTrackFromScene / setTrackVolume
    - playSceneById / activateSceneBySlot (D-03 keyboard dispatch)
    - renderSoundboard / renderAudioLibrary / renderSceneList (all user strings via esc())
    - Alt+Shift+0..5 keyboard quick-slots in keyboard-shortcuts.js
    - 4 activated Soundboard E2E tests (UX-01a/b/c/e)
  affects:
    - core/data.js (D.soundboard.scenes schema added)
    - ui/actions/system-actions.js (8 new soundboard data-action handlers)
    - assets/styles/tools.css (sb-* CSS classes, ~180 lines)
    - CLAUDE.md (keyboard shortcuts table updated)

tech-stack:
  added:
    - Soundboard UI (Audio-Bibliothek + Szenen-Builder) — pure JS HTML templates
    - Alt+Shift+0..5 keyboard binding via e.code Digit0-5 (layout-safe, A4)
  patterns:
    - Defensive container guard with DEBUG_MODE warn (TAB_RENDER_REGISTRY pattern)
    - All user strings (file names, scene names) via esc() (T-07-AUDIO-NAME)
    - Async renderAudioLibrary/renderSceneList called after static scaffold render
    - data-action delegation — no inline onclick anywhere
    - checkAudioFileSize block-before-write in importAudioFile (T-07-AUDIO-DOS)
    - activateSceneBySlot: D.soundboard.scenes slot-lookup before activateSoundScene call
    - e.code Digit0-5 primary match + e.key fallback (keyboard layout safety, A4)
    - Keyboard quick-slot block placed BEFORE isTyping guard (works in text fields)

key-files:
  created: []
  modified:
    - features/soundboard/soundboard-crud.js
    - features/soundboard/soundboard-render.js
    - systems/spellslots/keyboard-shortcuts.js
    - ui/actions/system-actions.js
    - assets/styles/tools.css
    - core/data.js
    - tests/e2e/features/soundboard.spec.js
    - CLAUDE.md

decisions:
  - "D.soundboard.scenes in D (not IDB) — scene metadata is trivial config; no Undo (consistent with Inspiration/leveling-mode precedent)"
  - "e.code Digit0-5 primary match + e.key fallback — avoids AltGr layout ambiguity on Windows (A4)"
  - "Alt+Shift block BEFORE isTyping guard — combo won't accidentally trigger text input; works even when focus is in editor"
  - "setInputFiles + dispatchEvent('change') pattern in E2E — Playwright fires change event on setInputFiles, dispatchEvent is belt-and-suspenders"
  - "importAudioFile accepts both Event and HTMLInputElement (ctx.target.files) — EventDelegation passes ctx.target, not the raw event"
  - "Per-track volume pct label updated inline in set-track-volume action handler — no full re-render on slider drag"

metrics:
  duration: ~35min
  completed: "2026-06-20"
  tasks_completed: 3
  files_modified: 8
---

# Phase 7 Plan 03: Soundboard UI (Audio-Bibliothek + Szenen-Builder) Summary

**Vollstaendige Soundboard-UI auf dem 07-02-Engine-Fundament: Audio-Bibliothek mit Import/Remove, Szenen-Builder mit geschichteten Tracks und Per-Track-Lautstarkeregler, Play/Stop-Controls, und Alt+Shift+1..5-Keyboard-Quick-Slots.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-06-20
- **Tasks:** 3/3
- **Files modified:** 8

## Accomplishments

### Task 1: Audio Import + Scene CRUD (275f17b)

- `soundboard-crud.js`: Vollstaendige Implementierung — `importAudioFile` prueft `checkAudioFileSize` vor jedem IDB-Write (T-07-AUDIO-DOS hard block bei >100 MB); `removeAudioFile` bereinigt dangling blobId-Referenzen in Szenen-Tracks; vollstaendiges Scene CRUD (create/rename/delete/addTrack/removeTrack/setTrackVolume); `playSceneById` wandelt scene.tracks in activateSoundScene-Format um; `activateSceneBySlot` fuer D-03 Keyboard-Dispatch
- `core/data.js`: `D.soundboard.scenes = []`-Schema hinzugefuegt; Audio-Blobs kommen NIE in D (D-01)
- `system-actions.js`: 8 neue data-action Handler — import-audio, soundboard-file-change, remove-audio, create-scene, delete-scene, play-scene, stop-all-audio, toggle-soundboard-mute, add-track, remove-track, set-track-volume (kein inline onclick)

### Task 2: Soundboard Render + CSS (88f73d1)

- `soundboard-render.js`: `renderSoundboard` (defensiver Container-Guard), `renderAudioLibrary` (async IDB-Liste mit Size-Warning-Hervorhebung), `renderSceneList` (Szenen-Cards mit Slot-Badge, Play-Button, Per-Track-Volume-Slider, Add-Track-Select); ALLE Benutzereingaben (Dateiname, Szenenname) via `esc()` — T-07-AUDIO-NAME
- `tools.css`: sb-*-CSS-Klassen (ca. 180 Zeilen) — Library-Rows, Szenen-Cards, Volume-Slider (accent-color var(--gold)), Slot-Badge, Add-Track-Row; wiederverwendet existierende .btn/.btn-sm/.btn-icon Klassen; responsive bei 480px

### Task 3: Keyboard Quick-Slots + E2E (a9e9d7e)

- `keyboard-shortcuts.js`: Alt+Shift+0..5-Block VOR isTyping-Guard eingefuegt; e.code Digit0-5 primaer (layout-sicher, A4) + e.key Fallback; Slot 0 -> toggleSoundboardMute, Slots 1-5 -> activateSceneBySlot; kein Konflikt mit bestehendem Alt+digit-Wuerfelblock (shiftKey trennt die beiden Bloecke)
- `soundboard.spec.js`: Alle 4 Wave-0 test.skip aktiviert und bestanden (4/4 gruene E2E-Tests): soundboard tab renders (UX-01a), import audio file (UX-01b), audio blob persists after reload (UX-01c), scene quickslot keyboard (UX-01e)
- `CLAUDE.md`: Keyboard-Shortcuts-Tabelle um Alt+Shift+0..5-Soundboard-Zeilen ergaenzt

## Task Commits

1. **Task 1: Audio Import + Scene CRUD** — `275f17b` (feat)
2. **Task 2: Soundboard UI — Render + CSS** — `88f73d1` (feat)
3. **Task 3: Keyboard Quick-Slots + E2E aktiviert** — `a9e9d7e` (feat)

## Files Created/Modified

- `features/soundboard/soundboard-crud.js` — vollstaendige Implementierung (vorher: Platzhalter-Skeleton)
- `features/soundboard/soundboard-render.js` — vollstaendige UI (vorher: Platzhalter mit Stub-Text)
- `systems/spellslots/keyboard-shortcuts.js` — Alt+Shift+0..5-Block hinzugefuegt
- `ui/actions/system-actions.js` — 11 neue Soundboard data-action Handler
- `assets/styles/tools.css` — sb-* CSS-Klassen (SOUNDBOARD-Sektion belebt)
- `core/data.js` — D.soundboard.scenes Schema
- `tests/e2e/features/soundboard.spec.js` — 4 aktivierte E2E-Tests
- `CLAUDE.md` — Keyboard-Shortcuts-Tabelle aktualisiert

## Decisions Made

- **D.soundboard.scenes in D:** Szenen-Metadaten (Name, Slot, Track-Refs, Volumes) sind kleine Konfig-Objekte → localStorage via save(). Kein Undo (consistent mit Inspiration/levelingMode precedent). Audio-Blobs bleiben ausschliesslich in IDB (D-01).
- **e.code Digit0-5 primaer:** Keyboard-Layout-Ambiguitaet (Windows AltGr, A4) durch Code-basierte Pruefrung vermieden; e.key als Fallback.
- **Keyboard-Block vor isTyping-Guard:** Alt+Shift-Kombination kollidiert nicht mit Textfeld-Eingaben; bewusstes Design damit Scene-Switching auch bei fokussiertem Input funktioniert.
- **importAudioFile akzeptiert Input-Element:** EventDelegation uebergibt ctx.target (HTMLInputElement), nicht das Event-Objekt selbst — fix in Task 3 (Rule 1 Auto-fix Bug).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] importAudioFile akzeptierte kein direktes Input-Element**
- **Found during:** Task 3 E2E — "import audio file" Test schlug fehl (blobCount = 0)
- **Issue:** `importAudioFile(fileOrEvent)` prueft `fileOrEvent.target.files` (fuer DOM-Event), aber EventDelegation uebergibt `ctx.target` (das HTMLInputElement direkt, ohne .target-Wrapper). Die `files`-Eigenschaft sitzt direkt auf dem Element.
- **Fix:** Zusaetzliche Zweig-Pruefrung `if (fileOrEvent && fileOrEvent.files)` fuer den Fall dass direkt das Input-Element uebergeben wird.
- **Files modified:** `features/soundboard/soundboard-crud.js`
- **Commit:** a9e9d7e (in Task-3-Commit enthalten)

**2. [Rule 2 - Missing Functionality] Inline onclick in add-track-Button entfernt**
- **Found during:** Task 2 Code-Review (CLAUDE.md verbietet inline Handler)
- **Issue:** Erste Implementation des add-track-Buttons nutzte inline onclick zum Auslesen des Select-Werts.
- **Fix:** Select-Element wird im action-Handler per DOM-Query (`.sb-add-track-select[id="sb-add-select-${sceneId}"]`) gelesen; kein inline onclick.
- **Files modified:** `features/soundboard/soundboard-render.js`, `ui/actions/system-actions.js`
- **Commit:** 88f73d1

## Known Stubs

Keine in diesem Plan. Alle Soundboard-Funktionen (import, scene CRUD, render, keyboard) sind vollstaendig implementiert und getestet.

Noch bestehende Stubs aus anderen Plaenen (unveraendert):
- UX-01g: "scene hard cut fallback" E2E — als N/A markiert (D-02 full implementiert, D-02a entfaellt)
- UX-01d: Audio-Wiedergabe manuell pruefbar (Playwright kann keine echte Audio-Ausgabe verifizieren)

## Threat Flags

Keine neuen Bedrohungsflaechen jenseits des geplanten Threat Models. Alle T-07-*-Mitigationen implementiert:

- T-07-AUDIO-NAME: esc() in allen Render-Funktionen (grep -c "esc(" = 18 Treffer in soundboard-render.js)
- T-07-AUDIO-DOS: checkAudioFileSize block-before-write in importAudioFile (hard block > 100 MB; warn > 20 MB)
- T-07-KBD-CONFLICT: e.code Digit0-5 primaer; kein Konflikt mit bestehendem Alt+digit-Block (shiftKey-Trennung verifiziert)
- T-07-DEDUP: kein `var X = window.X` fuer const-Globals; Build sauber (kein [DEDUP] SyntaxError)

## Self-Check: PASSED

Files vorhanden:
- `features/soundboard/soundboard-crud.js` — FOUND
- `features/soundboard/soundboard-render.js` — FOUND
- `systems/spellslots/keyboard-shortcuts.js` — FOUND
- `tests/e2e/features/soundboard.spec.js` — FOUND

Commits verifiziert in git log:
- `275f17b`: feat(07-03): Audio Import + Scene CRUD (Task 1) — FOUND
- `88f73d1`: feat(07-03): Soundboard UI — Render + CSS (Task 2) — FOUND
- `a9e9d7e`: feat(07-03): Keyboard Quick-Slots + E2E aktiviert (Task 3) — FOUND

Test-Ergebnisse:
- `npm run test`: 432 passed, 1 todo, 21 Suites — GRUEN
- `npx playwright test soundboard.spec.js`: 4/4 bestanden (UX-01a/b/c/e) — GRUEN
- `PYTHONIOENCODING=utf-8 python build.py`: exits 0, module-sync OK, kein [DEDUP] — GRUEN

---
*Phase: 07-komfort-analyse*
*Completed: 2026-06-20*
