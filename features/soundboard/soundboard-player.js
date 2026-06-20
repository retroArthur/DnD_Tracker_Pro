// [SECTION:SOUNDBOARD_PLAYER]
// Web Audio API Engine fuer Soundboard (Phase 7 — UX-01, D-02)
// Layered tracks, per-track GainNode, Crossfade bei Szenen-Wechsel + Crossfade-Loop.
//
// DESIGN:
//   - `_soundboardAudioContext` (einmaliger, lazy initialisierter AudioContext, RESEARCH Pitfall 5)
//   - `_bufferCache` (Map<blobId, AudioBuffer>) — decodierte Buffer gecacht, nie in IDB (Pitfall 4)
//   - Gain-Graph pro Track: iterationSource -> iterationGain (Loop-Crossfade) -> trackGain (Volume/Mute/Szenen-Fade) -> destination
//   - Crossfade-Loop: statt source.loop=true plant ein Scheduler pro Durchlauf eine neue One-Shot-Quelle,
//     die C Sekunden vor Ende der laufenden startet (Ueberlappung -> nahtlos, Design 2026-06-20)
//   - getSoundBlob() aufgerufen per blobId — kein const-Alias von window (CLAUDE.md Dedup-Regel)

// Szenen-Crossfade-Dauer in Sekunden (D-02, Planner-Ermessen)
const CROSSFADE_DURATION = 2;
// Max. Crossfade pro Loop-Durchlauf (bei kurzen Clips auf Dauer*0.5 gekappt)
const LOOP_CROSSFADE_MAX = 1.5;
// Fade-out beim Stoppen (statt Hartschnitt)
const STOP_FADE = 0.5;
// Fade beim Stummschalten
const MUTE_FADE = 0.3;

// Einziger AudioContext (uniquely named, RESEARCH Pitfall 5)
let _soundboardAudioContext = null;

// AudioBuffer-Cache: blobId -> AudioBuffer (vermeidet re-decoding, Pitfall 4)
// FIFO-Begrenzung: dekodierte PCM-Buffer belegen ein Vielfaches der komprimierten
// Datei im RAM — Cache auf MAX_BUFFER_CACHE Einträge deckeln (WR-03).
const MAX_BUFFER_CACHE = 10;
const _bufferCache = new Map();

// Aktuell spielende Szene.
// tracks: [{ blobId, trackGain, targetVolume, loop, buffer, duration, iterStart, sources:[], schedulerId, _active }]
let _activeScene = { sceneId: null, tracks: [], muted: false };

// Master-Mute-Status
let _muteActive = false;

// requestAnimationFrame-Handle fuer die Fortschrittsanzeige
let _progressRafId = null;

/**
 * computeCrossfade(duration) — Crossfade-Dauer fuer einen Loop-Durchlauf.
 * Reine Funktion (unit-getestet). Kappt auf Dauer*0.5 bei kurzen Clips.
 * @param {number} duration  Pufferdauer in Sekunden
 * @returns {number} Crossfade in Sekunden (0 bei ungueltiger Dauer)
 */
function computeCrossfade(duration) {
    if (!duration || duration <= 0) return 0;
    return Math.min(LOOP_CROSSFADE_MAX, duration * 0.5);
}

/**
 * computeProgress(elapsed, duration) — Position 0..1 innerhalb des aktuellen Durchlaufs.
 * Reine Funktion (unit-getestet). Clamped auf [0,1], 0 bei ungueltiger Dauer.
 * @param {number} elapsed   Sekunden seit Iterations-Start
 * @param {number} duration  Pufferdauer in Sekunden
 * @returns {number} 0..1
 */
function computeProgress(elapsed, duration) {
    if (!duration || duration <= 0) return 0;
    let p = elapsed / duration;
    if (p < 0) p = 0;
    if (p > 1) p = 1;
    return p;
}

/**
 * getAudioContext() — Lazy-Init des AudioContext.
 * MUSS innerhalb einer Nutzergeste aufgerufen werden (Autoplay-Policy, Pitfall 1).
 * @returns {AudioContext}
 */
function getAudioContext() {
    if (!_soundboardAudioContext) {
        _soundboardAudioContext = new AudioContext();
    }
    // Resume nach Autoplay-Suspend (Pitfall 1)
    if (_soundboardAudioContext.state === 'suspended') {
        _soundboardAudioContext.resume();
    }
    return _soundboardAudioContext;
}

/**
 * loadTrackBuffer(blobId) — Blob aus IDB laden und als AudioBuffer dekodieren.
 * Gecachte Buffer werden direkt zurueckgegeben.
 * Decode-Fehler werden per showToast angezeigt (T-07-AUDIO-DECODE).
 * @param {string} blobId
 * @returns {Promise<AudioBuffer|null>}
 */
async function loadTrackBuffer(blobId) {
    // Cache-Hit
    if (_bufferCache.has(blobId)) {
        return _bufferCache.get(blobId);
    }

    // getSoundBlob ist in soundboard-idb.js definiert und global verfuegbar
    const blob = await window.getSoundBlob(blobId);
    if (!blob) {
        if (typeof showToast === 'function') {
            showToast('Audio-Datei nicht gefunden (ID: ' + esc(blobId) + ')', 'error');
        }
        return null;
    }

    const arrayBuffer = await blob.arrayBuffer();
    const ctx = getAudioContext();

    try {
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        // FIFO-Eviction: ältesten Eintrag entfernen, sobald die Grenze erreicht ist (WR-03)
        if (_bufferCache.size >= MAX_BUFFER_CACHE) {
            const oldestKey = _bufferCache.keys().next().value;
            if (oldestKey !== undefined) _bufferCache.delete(oldestKey);
        }
        _bufferCache.set(blobId, audioBuffer);
        return audioBuffer;
    } catch (err) {
        if (typeof showToast === 'function') {
            showToast('Audio konnte nicht gelesen werden', 'error');
        }
        if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
            console.warn('[Soundboard] decodeAudioData fehlgeschlagen fuer ' + blobId, err);
        }
        return null;
    }
}

/**
 * scheduleIteration(track, startTime) — Einen Wiedergabe-Durchlauf eines Tracks planen.
 * Erzeugt eine One-Shot-Quelle mit Fade-Huellkurve und planт — falls track.loop —
 * den naechsten Durchlauf C Sekunden vor Ende (Crossfade-Ueberlappung).
 * @param {Object} track  Track-State aus _activeScene.tracks
 * @param {number} startTime  AudioContext-Zeit fuer den Start
 */
function scheduleIteration(track, startTime) {
    const ctx = getAudioContext();
    const src = ctx.createBufferSource();
    src.buffer = track.buffer;
    src.loop = false;

    const iterGain = ctx.createGain();
    src.connect(iterGain);
    iterGain.connect(track.trackGain);

    const D = track.duration;
    const C = computeCrossfade(D);

    // Fade-in
    iterGain.gain.setValueAtTime(0, startTime);
    if (C > 0) {
        iterGain.gain.linearRampToValueAtTime(1, startTime + C);
    } else {
        iterGain.gain.setValueAtTime(1, startTime);
    }
    // Fade-out am Ende nur beim Loopen (One-Shot soll ausklingen, z.B. Gong)
    if (track.loop && C > 0) {
        iterGain.gain.setValueAtTime(1, startTime + Math.max(0, D - C));
        iterGain.gain.linearRampToValueAtTime(0, startTime + D);
    }

    src.start(startTime);
    if (D > 0) {
        src.stop(startTime + D + 0.05);
    }
    track.sources.push(src);
    track.iterStart = startTime;

    src.onended = function() {
        track.sources = track.sources.filter(function(s) { return s !== src; });
        try { src.disconnect(); } catch (e) { /* schon getrennt */ }
        try { iterGain.disconnect(); } catch (e) { /* schon getrennt */ }
    };

    // Naechsten Durchlauf planen (nur bei Loop und sinnvoller Dauer)
    if (track.loop && D > 0) {
        const period = Math.max(0.05, D - C);
        const nextStart = startTime + period;
        const delayMs = Math.max(0, (nextStart - ctx.currentTime) * 1000 - 50); // 50ms Lookahead
        track.schedulerId = setTimeout(function() {
            if (!track._active) return;
            const ctx2 = getAudioContext();
            const preciseStart = Math.max(ctx2.currentTime, nextStart);
            scheduleIteration(track, preciseStart);
        }, delayMs);
    }
}

/**
 * activateSoundScene(scene) — Neue Szene mit Crossfade aktivieren.
 * Alte Tracks blenden ueber CROSSFADE_DURATION aus (Scheduler abgebrochen),
 * neue blenden ein und starten ihren Crossfade-Loop bzw. spielen einmal.
 *
 * @param {Object} scene  - { sceneId?: string, tracks: [{ blobId, volume, loop }] }
 * @returns {Promise<void>}
 */
async function activateSoundScene(scene) {
    if (!scene || typeof scene !== 'object' || !Array.isArray(scene.tracks)) {
        return;
    }

    const ctx = getAudioContext();
    const fadeOutAt = ctx.currentTime;

    // Alte Szene ausblenden + Scheduler abbrechen (sofort, vor dem await)
    const oldTracks = _activeScene.tracks.slice();
    oldTracks.forEach(function(t) {
        t._active = false;
        if (t.schedulerId) { clearTimeout(t.schedulerId); t.schedulerId = null; }
        if (t.trackGain) {
            t.trackGain.gain.setValueAtTime(t.trackGain.gain.value, fadeOutAt);
            t.trackGain.gain.linearRampToValueAtTime(0, fadeOutAt + CROSSFADE_DURATION);
        }
        t.sources.forEach(function(src) {
            try { src.stop(fadeOutAt + CROSSFADE_DURATION + 0.1); } catch (e) { /* schon gestoppt */ }
        });
    });

    // Neue Buffers laden (parallel)
    const loaded = await Promise.all(
        scene.tracks.map(async function(tr) {
            const buf = await loadTrackBuffer(tr.blobId);
            return buf ? {
                blobId: tr.blobId,
                buffer: buf,
                volume: typeof tr.volume === 'number' ? tr.volume : 1,
                loop: tr.loop !== false // Default true (abwaertskompatibel)
            } : null;
        })
    );
    const valid = loaded.filter(Boolean);

    const ctx2 = getAudioContext();
    const start = ctx2.currentTime;

    const newTracks = valid.map(function(t) {
        const trackGain = ctx2.createGain();
        trackGain.gain.setValueAtTime(0, start);
        trackGain.gain.linearRampToValueAtTime(_muteActive ? 0 : t.volume, start + CROSSFADE_DURATION);
        trackGain.connect(ctx2.destination);

        const track = {
            blobId: t.blobId,
            trackGain: trackGain,
            targetVolume: t.volume,
            loop: t.loop,
            buffer: t.buffer,
            duration: t.buffer.duration,
            iterStart: start,
            sources: [],
            schedulerId: null,
            _active: true
        };
        scheduleIteration(track, start);
        return track;
    });

    _activeScene = { sceneId: scene.sceneId || null, tracks: newTracks, muted: _muteActive };
    _startProgress();
}

/**
 * stopAllTracks() — Alle aktiven Tracks mit kurzem Fade-out stoppen und Szene leeren.
 */
function stopAllTracks() {
    const ctx = _soundboardAudioContext;
    const now = ctx ? ctx.currentTime : 0;
    _activeScene.tracks.forEach(function(t) {
        t._active = false;
        if (t.schedulerId) { clearTimeout(t.schedulerId); t.schedulerId = null; }
        if (ctx && t.trackGain) {
            t.trackGain.gain.setValueAtTime(t.trackGain.gain.value, now);
            t.trackGain.gain.linearRampToValueAtTime(0, now + STOP_FADE);
        }
        t.sources.forEach(function(src) {
            try { src.stop(now + STOP_FADE + 0.05); } catch (e) { /* schon gestoppt */ }
        });
    });
    _activeScene = { sceneId: null, tracks: [], muted: false };
    _muteActive = false;
    _stopProgress();
}

/**
 * toggleSoundboardMute() — Alle aktiven Tracks stummschalten / wieder einschalten.
 * Nutzt linearRampToValueAtTime fuer einen weichen Fade (MUTE_FADE).
 */
function toggleSoundboardMute() {
    if (!_soundboardAudioContext) return;
    const ctx = _soundboardAudioContext;
    const now = ctx.currentTime;

    if (!_muteActive) {
        _activeScene.tracks.forEach(function(t) {
            t.trackGain.gain.setValueAtTime(t.trackGain.gain.value, now);
            t.trackGain.gain.linearRampToValueAtTime(0, now + MUTE_FADE);
        });
        _muteActive = true;
    } else {
        _activeScene.tracks.forEach(function(t) {
            t.trackGain.gain.setValueAtTime(t.trackGain.gain.value, now);
            t.trackGain.gain.linearRampToValueAtTime(t.targetVolume, now + MUTE_FADE);
        });
        _muteActive = false;
    }
    _activeScene.muted = _muteActive;
}

/**
 * _progressTick() — RAF-Schleife: aktualisiert die Fortschrittsbalken der aktiven Szene.
 * Nur die DOM-Zeilen der aktiven Szene werden angefasst.
 */
function _progressTick() {
    if (!_activeScene.sceneId || _activeScene.tracks.length === 0 || !_soundboardAudioContext) {
        _progressRafId = null;
        return;
    }
    const ctx = _soundboardAudioContext;
    const sceneSel = '.sb-scene-card[data-scene-id="' + _activeScene.sceneId + '"]';
    _activeScene.tracks.forEach(function(t) {
        const pct = computeProgress(ctx.currentTime - t.iterStart, t.duration) * 100;
        const fill = document.querySelector(
            sceneSel + ' .sb-track-row[data-blob-id="' + t.blobId + '"] .sb-progress-fill'
        );
        if (fill) fill.style.width = pct.toFixed(1) + '%';
    });
    _progressRafId = requestAnimationFrame(_progressTick);
}

function _startProgress() {
    if (_progressRafId != null) return;
    if (typeof requestAnimationFrame !== 'function') return;
    _progressRafId = requestAnimationFrame(_progressTick);
}

function _stopProgress() {
    if (_progressRafId != null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(_progressRafId);
    }
    _progressRafId = null;
}

/**
 * getActiveSceneId() — ID der aktuell spielenden Szene, oder null.
 */
function getActiveSceneId() {
    return _activeScene ? _activeScene.sceneId : null;
}

/**
 * stopAllTracksIfScene(sceneId) — Audio NUR stoppen, wenn genau diese Szene gerade spielt.
 * Wird beim Löschen/Ändern einer Szene aufgerufen, damit kein verwaistes Audio weiterläuft
 * (Web Audio überlebt sonst das Entfernen der Szene aus D).
 */
function stopAllTracksIfScene(sceneId) {
    if (sceneId && _activeScene && _activeScene.sceneId === sceneId) {
        stopAllTracks();
    }
}

// Exports (07-03 Keyboard-Slots + UI rufen diese auf)
window.activateSoundScene = activateSoundScene;
window.stopAllTracks = stopAllTracks;
window.stopAllTracksIfScene = stopAllTracksIfScene;
window.getActiveSceneId = getActiveSceneId;
window.toggleSoundboardMute = toggleSoundboardMute;
window.getAudioContext = getAudioContext;
// Reine Helfer fuer Unit-Tests
window.computeCrossfade = computeCrossfade;
window.computeProgress = computeProgress;
