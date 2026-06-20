# Soundboard: Per-Track-Loop, Crossfade-Wiederholung & Fortschrittsanzeige

**Datum:** 2026-06-20 · **Scope:** Erweiterung von Phase 7 (Soundboard, UX-01) · **Status:** Design genehmigt

## Ziel

Drei vom Nutzer gewünschte Komfort-Features für das Soundboard:

1. **Per-Track-Loop-Schalter** — jeder Track kann einzeln looped (Default an) oder als One-Shot gespielt werden.
2. **Echte Crossfade-Wiederholung** — looped Tracks blenden an der Loop-Naht überlappend (~1,5 s) über, statt hart zu schneiden → nahtloser Ambient-Sound.
3. **Track-Fortschrittsanzeige** — dünner Balken pro Track-Zeile, füllt 0→100 % pro Durchlauf, setzt beim Loop zurück; nur die aktive Szene zeigt laufende Balken.

## Entscheidungen (genehmigt)

- Loop-Schalter **pro Track** (nicht pro Szene).
- **Echter Crossfade** (überlappende Quellen), nicht Fade-Dip.
- **Schlanker Balken** ohne Zeitzahlen.
- Loop-Umschalten wirkt **beim nächsten Play** der Szene (kein Live-Umschalten im laufenden Loop — möglicher späterer Ausbau).
- Crossfade-Dauer **~1,5 s**, bei kurzen Clips automatisch auf `Dauer × 0,5` gekappt.
- **„Alle stoppen"** bekommt einen kurzen Fade-out (~0,5 s) statt Hartschnitt (Konsistenz mit Fade-Thema; Mute fadet bereits).

## Datenmodell

`D.soundboard.scenes[].tracks[]`: `{ blobId, volume }` → `{ blobId, volume, loop }`.
Fehlendes `loop` ⇒ `true` (alte Szenen behalten heutiges Loop-Verhalten). Keine Migration (triviale Konfig, wie `volume`).

## Architektur

### Audio-Engine (`features/soundboard/soundboard-player.js`)

Zwei-Ebenen-Gain-Graph pro Track:

```
iterationSource → iterationGain (Loop-Crossfade-Hüllkurve) ─┐
iterationSource → iterationGain ───────────────────────────┴→ trackGain (Volume·Mute·Szenen-Fade) → destination
```

- **Reine Helfer (unit-getestet):**
  - `computeCrossfade(duration)` → `duration <= 0 ? 0 : min(1.5, duration * 0.5)`
  - `computeProgress(elapsed, duration)` → `duration > 0 ? clamp(elapsed / duration, 0, 1) : 0`
- **Crossfade-Loop:** Statt `source.loop = true` plant ein Scheduler pro Durchlauf eine neue One-Shot-Quelle, die `C` Sekunden vor Ende der laufenden startet (Überlappung). `iterationGain`-Hüllkurve: 0→1 über `C` (Fade-in), halten, 1→0 über `C` am Ende (Fade-out). Spacing der Iterationen = `D - C`. Nächster Start via `setTimeout` mit ~50 ms Lookahead, präziser Start an der `AudioContext`-Uhr.
- **One-Shot (loop=false):** eine Iteration mit Fade-in, endet von selbst (`onended` räumt auf).
- **Aktiver-Szenen-State** erweitert: `_activeScene = { sceneId, tracks:[{ blobId, trackGain, targetVolume, loop, duration, iterStart, sources:[], schedulerId }], muted }`.
- **Szenenwechsel:** alte Scheduler `clearTimeout`, trackGains über 2 s →0, Quellen danach stoppen; neue Tracks-trackGains 0→Volume (Szenen-Crossfade unverändert).
- **`stopAllTracks`:** alle Scheduler abbrechen, trackGains ~0,5 s Fade-out, Quellen danach stoppen, RAF stoppen, State leeren.
- **Mute:** operiert weiter auf den `trackGain`s (jetzt `_activeScene.tracks[].trackGain`).

### Fortschrittsanzeige (`player.js` + `render`)

Ein globaler `requestAnimationFrame`-Updater (startet beim Play, stoppt bei `stopAllTracks`/leerer Szene; in versteckten Tabs drosselt der Browser RAF automatisch). Pro aktivem Track:
`pct = computeProgress(ctx.currentTime - track.iterStart, track.duration) * 100` → setzt Breite von `.sb-progress-fill` in der zur aktiven Szene + blobId passenden Zeile. (Approximativer Positions-Indikator, kein Sample-Cursor — setzt im Crossfade-Fenster leicht früh zurück.)

### UI (`features/soundboard/soundboard-render.js`)

Track-Zeile (`.sb-track-row`, neu mit `data-blob-id`): `[🔁 Loop-Toggle] [Name + Fortschrittsbalken] [Volume + %] [✕]`.
Loop-Button: `data-action="toggle-track-loop"`, Icon/Status je `track.loop`. Fortschritt: `<div class="sb-progress"><div class="sb-progress-fill"></div></div>`.

### Aktion (`ui/actions/system-actions.js`)

`'toggle-track-loop'`: liest `sceneId`/`blobId` aus `ctx.target.dataset` (String-IDs!), ruft `setTrackLoop`, `renderSceneList`.

### CRUD (`features/soundboard/soundboard-crud.js`)

- `setTrackLoop(sceneId, blobId, loop)` — setzt Flag, `save()`.
- `addTrackToScene` setzt `loop: true` per Default.
- `playSceneById` reicht `track.loop` an `activateSoundScene` durch.

### CSS (`assets/styles/tools.css`)

`.sb-loop-btn` (aktiv/inaktiv), `.sb-progress` (4 px Schiene), `.sb-progress-fill` (Akzent, `width`-Transition aus — RAF setzt direkt).

## Edge Cases

- Clip kürzer als Crossfade ⇒ `computeCrossfade` kappt; sehr kurz ⇒ Crossfade ~0, faktisch nahtloser Re-Trigger.
- Decode-Fehler ⇒ Track überspringen (bestehendes Verhalten).
- Szenenwechsel/Stop ⇒ alle `schedulerId` `clearTimeout` (kein verwaister Loop).
- Mute während Loop ⇒ trackGains auf 0, Scheduler/Progress laufen weiter (stumm).
- Abwärtskompatibilität ⇒ `loop` fehlt = `true`.

## Tests

- **Unit (jsdom, kein echtes Audio):** `computeCrossfade` (Kappung, 0-Schutz), `computeProgress` (Wrap/Clamp/0-Schutz), `setTrackLoop` (Flag + Default), `addTrackToScene` Default `loop:true`.
- **E2E (Playwright, file://):** Loop-Toggle rendert pro Track, Umschalten überlebt Reload (`D.soundboard.scenes[].loop`), Fortschrittsbalken-Element vorhanden.
- **Manuell/Human-UAT:** hörbare Crossfade-Glätte (nicht automatisierbar).

## Task-Schnitt

1. **Reine Logik + Daten (TDD):** `computeCrossfade`/`computeProgress` in player.js, `setTrackLoop` + Default in crud.js — Unit-Tests zuerst.
2. **Engine:** player.js Crossfade-Loop-Scheduler + erweiterter `_activeScene` + Stop-Fade + RAF-Progress.
3. **UI:** render.js Loop-Button + Fortschrittsbalken + `data-blob-id`; system-actions `toggle-track-loop`; tools.css.
4. **E2E + Build + Verifikation.**
