---
phase: 07-komfort-analyse
plan: "02"
subsystem: audio
tags: [web-audio-api, indexeddb, soundboard, crossfade, gainnode, blob-persistence]

dependency_graph:
  requires:
    - phase: 07-01
      provides: IDB v4 audioBlobs store, soundboard skeleton modules (soundboard-idb.js, soundboard-player.js)
  provides:
    - saveSoundBlob / getSoundBlob / deleteSoundBlob / listSoundBlobs (IDB CRUD)
    - checkAudioFileSize + MAX_AUDIO_BYTES (size guard, T-07-AUDIO-DOS)
    - getAudioContext (lazy singleton, autoplay-safe)
    - loadTrackBuffer (Blob → AudioBuffer decode, cached in _bufferCache)
    - activateSoundScene (layered looping + linearRampToValueAtTime crossfade, D-02 full)
    - stopAllTracks / toggleSoundboardMute
  affects:
    - 07-03 (Scene CRUD + UI wires activateSoundScene, keyboard slots)
    - 07-VALIDATION (UX-01f unit test now passes)

tech-stack:
  added:
    - Web Audio API (AudioContext, AudioBufferSourceNode, GainNode, decodeAudioData)
    - IDB audioBlobs store (reads/writes — store was created in 07-01)
  patterns:
    - Lazy singleton AudioContext (_soundboardAudioContext) with autoplay resume
    - _bufferCache Map<blobId, AudioBuffer> avoids re-decode on repeated scene activation
    - New BufferSource per play (one-shot node semantics, RESEARCH Pitfall 2)
    - linearRampToValueAtTime crossfade over CROSSFADE_DURATION (2s)
    - checkAudioFileSize pure helper — no side effects, testable in Jest without DOM/IDB

key-files:
  created: []
  modified:
    - features/soundboard/soundboard-idb.js
    - features/soundboard/soundboard-player.js
    - tests/unit/soundboard.test.js

key-decisions:
  - "D-02 full layered crossfade implemented (not D-02a hard-cut) — code delta was modest; user example (Regen + Taverne + Feuer) is layered by definition"
  - "CROSSFADE_DURATION = 2 seconds — planner discretion, good perceptual balance between speed and smoothness"
  - "_soundboardAudioContext as unique let variable (not const audioContext) — prevents global-scope dedup collision (RESEARCH Pitfall 5 / T-07-DEDUP)"
  - "_bufferCache never written to IDB — AudioBuffer is not IDB-serializable (RESEARCH Pitfall 4)"
  - "listSoundBlobs strips blob bytes from payload — metadata only, prevents inadvertent large object transfer"
  - "activateSoundScene accepts {tracks:[{blobId,volume}]} object; numeric slotIndex guard added for D-03 keyboard path (07-03 resolves slot to scene object before calling)"

patterns-established:
  - "Audio IDB pattern: initIndexedDB() + transaction(['audioBlobs']) mirrors backups.js:88 exactly"
  - "Size guard: call checkAudioFileSize before ANY IDB write; hard block at >100 MB, soft warn at >20 MB"
  - "Web Audio lifecycle: getAudioContext() inside user-gesture functions only; resume if suspended"

requirements-completed: [UX-01]

duration: ~25min
completed: "2026-06-20"
---

# Phase 7 Plan 02: Soundboard Engine (IDB Blob + Web Audio) Summary

**Web Audio engine mit layertem Crossfade, IDB-Blob-Persistenz und 100-MB-Hard-Block; 5 neue Unit-Tests ersetzen den Wave-0-Stub.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-06-20
- **Tasks:** 2/2
- **Files modified:** 3

## Accomplishments

- `soundboard-idb.js`: vollstaendige IDB-Implementierung — saveSoundBlob blockiert Schreibzugriff bei > 100 MB (T-07-AUDIO-DOS), listSoundBlobs gibt nur Metadaten zurueck, getSoundBlob/deleteSoundBlob folgen dem backups.js-Transaktionsmuster
- `soundboard-player.js`: Web Audio API-Engine — einziger `_soundboardAudioContext`-Singleton, `_bufferCache` verhindert re-decode, `activateSoundScene` laed alle Tracks parallel und fuehrt 2-Sekunden-Crossfade per `linearRampToValueAtTime` durch (D-02 full)
- Unit-Tests: 5 echte Assertions ersetzen den `test.todo('size warning')` aus Wave-0; vollstaendige Grenzwert-Abdeckung (unter/an/ueber Warn-Schwelle, Hard-Block)
- Build: 123 Module, module-sync OK, kein [DEDUP]-SyntaxError, kein orphaned-return

## Task Commits

1. **Task 1: Audio Blob IDB store + size guard** — `0f383ce` (feat)
2. **Task 2: Web Audio engine — decode, loop, gain, scene crossfade** — `d6120db` (feat)

## Files Created/Modified

- `features/soundboard/soundboard-idb.js` — IDB-CRUD (saveSoundBlob, getSoundBlob, listSoundBlobs, deleteSoundBlob) + checkAudioFileSize + MAX_AUDIO_BYTES/MAX_AUDIO_BYTES_HARD; Window-Exports
- `features/soundboard/soundboard-player.js` — AudioContext-Singleton, Buffer-Cache, playTrack (loop + GainNode), activateSoundScene (Crossfade), stopAllTracks, toggleSoundboardMute; Window-Exports
- `tests/unit/soundboard.test.js` — 5 Jest-Assertions fuer UX-01f (size warning, warn threshold, hard block)

## Decisions Made

- **D-02 full statt D-02a:** Layered Crossfade implementiert — N AudioBufferSourceNodes pro Szene, GainNode pro Track, linearRampToValueAtTime; D-02a (hard cut, N=1) verworfen weil der Anwendungsfall (Regen + Taverne + Feuer) mehrere gleichzeitige Loops erfordert
- **CROSSFADE_DURATION = 2s:** Gut wahrnehmbarer Uebergang ohne Verzoegerungseffekt
- **_soundboardAudioContext:** Einzigartiger Modulname verhindert const-Dedup-Kollision (RESEARCH Pitfall 5); nicht auf window exportiert
- **activateSoundScene-Guard:** Numerischer slotIndex wird abgewiesen — 07-03 muss Slot zuerst in scene-Objekt umwandeln

## Deviations from Plan

Keine — Plan exakt ausgefuehrt.

Die `esc()`-Funktion wird in `loadTrackBuffer` fuer die Fehlertoast-Meldung verwendet (T-07-AUDIO-NAME vorsorgliche Massnahme), auch wenn dieses Modul kein HTML rendert.

## Known Stubs

Keine in diesem Plan. Die folgenden Module aus 07-01 bleiben bewusste Stubs fuer spaetere Phasen:
- `features/soundboard/soundboard-crud.js` — Scene-CRUD (07-03)
- `features/soundboard/soundboard-render.js` — Soundboard-UI (07-03)
- `features/dice-stats/dice-stats-render.js` — SVG-Histogramm (07-04)

## Threat Flags

Keine neuen Bedrohungsflaechen jenseits des geplanten Threat Models. Alle T-07-*-Mitigationen implementiert:
- T-07-AUDIO-DOS: checkAudioFileSize + hard block in saveSoundBlob
- T-07-AUDIO-DECODE: try/catch um decodeAudioData + showToast
- T-07-DEDUP: _soundboardAudioContext (unique name, no window export)
- T-07-AUDIO-NAME: esc() in Fehlermeldungen; Render-Pflicht an 07-03 weitergegeben

## Issues Encountered

Keine.

## Next Phase Readiness

07-03 (Scene CRUD + UI) kann direkt auf:
- `window.activateSoundScene(scene)` — scene = `{ tracks: [{ blobId, volume }] }`
- `window.stopAllTracks()`
- `window.toggleSoundboardMute()`
- `window.saveSoundBlob(id, file)` / `window.listSoundBlobs()` / `window.deleteSoundBlob(id)`
- `window.getAudioContext()` (fuer AudioContext-State-Checks in der UI)

Keyboard-Slots (D-03 Alt+Shift+1..5): 07-03 muss Slot → scene-Objekt aufloesen und `activateSoundScene(sceneObj)` aufrufen.

---
*Phase: 07-komfort-analyse*
*Completed: 2026-06-20*

## Self-Check: PASSED

Files present:
- `features/soundboard/soundboard-idb.js` — FOUND
- `features/soundboard/soundboard-player.js` — FOUND
- `tests/unit/soundboard.test.js` — FOUND

Commits verified in git log:
- `0f383ce`: feat(07-02): Audio Blob IDB store + size guard (Task 1) — FOUND
- `d6120db`: feat(07-02): Web Audio engine — decode, loop, gain, scene crossfade (Task 2) — FOUND

Test results: 426 passed, 7 todo, 21 suites (npx jest — all green)
Build: `PYTHONIOENCODING=utf-8 python build.py` exits 0, 123 modules, module-sync OK, no [DEDUP]
