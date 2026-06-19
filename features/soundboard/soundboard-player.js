// [SECTION:SOUNDBOARD_PLAYER]
// Web Audio API Engine fuer Soundboard (Phase 7 — UX-01, D-02)
// Layered looping tracks, per-track GainNode, Crossfade bei Szenen-Wechsel.
//
// DESIGN:
//   - `_soundboardAudioContext` (einmaliger, lazy initialisierter AudioContext, RESEARCH Pitfall 5)
//   - `_bufferCache` (Map<blobId, AudioBuffer>) — decodierte Buffer gecacht, nie in IDB (Pitfall 4)
//   - Jeder Track = eigener AudioBufferSourceNode (loop=true) + GainNode (Pitfall 2)
//   - Crossfade per linearRampToValueAtTime (D-02 full, nicht D-02a hard-cut)
//   - getSoundBlob() aufgerufen per blobId — kein const-Alias von window (CLAUDE.md Dedup-Regel)

// Crossfade-Dauer in Sekunden (D-02, Planner-Ermessen)
const CROSSFADE_DURATION = 2;

// Einziger AudioContext (uniquely named, RESEARCH Pitfall 5)
let _soundboardAudioContext = null;

// AudioBuffer-Cache: blobId -> AudioBuffer (vermeidet re-decoding, Pitfall 4)
const _bufferCache = new Map();

// Aktuell spielende Szene
let _activeScene = { sources: [], gains: [], muted: false };

// Master-Mute-Status und Lautstärke vor Stummschaltung
let _muteActive = false;
let _premuteVolumes = [];

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
 * playTrack(audioBuffer, volume) — Neuen BufferSource + GainNode erzeugen und starten.
 * Ein neuer Source-Node wird pro Aufruf erstellt (one-shot semantics, Pitfall 2).
 * @param {AudioBuffer} audioBuffer
 * @param {number} volume  - Ziel-Lautstaerke (0–1)
 * @returns {{ source: AudioBufferSourceNode, gain: GainNode }}
 */
function playTrack(audioBuffer, volume) {
    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = 0; // Start bei 0 — Crossfade regelt auf Ziel hoch
    gain.targetVolume = volume; // Custom-Property fuer Crossfade-Zugriff

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);

    return { source, gain };
}

/**
 * activateSoundScene(scene) — Neue Szene mit Crossfade aktivieren.
 * Setzt alte Tracks ueber linearRampToValueAtTime auf 0, neue von 0 auf Ziel-Lautstaerke.
 *
 * @param {Object} scene  - { tracks: [{ blobId: string, volume: number }] }
 *                          Wird auch mit `slotIndex` (number) aus D-03 Keyboard-Slots aufgerufen
 *                          (07-03 verarbeitet Slot → Scene-Objekt; player akzeptiert nur Object hier)
 * @returns {Promise<void>}
 */
async function activateSoundScene(scene) {
    // Schutz: slotIndex (number) kommt aus Keyboard-Handler (D-03, 07-03 verdrahtet es)
    // Wenn ein numerischer Slot uebergeben wird, ohne dass eine Scene-Definition vorliegt,
    // nichts tun — 07-03 wird activateSoundScene mit dem fertigen scene-Objekt aufrufen.
    if (!scene || typeof scene !== 'object' || !Array.isArray(scene.tracks)) {
        return;
    }

    // Alte Szene merken (fuer Crossfade)
    const oldSources = _activeScene.sources.slice();
    const oldGains = _activeScene.gains.slice();

    // Neue Tracks laden (parallel)
    const loadedTracks = await Promise.all(
        scene.tracks.map(async function(track) {
            const buf = await loadTrackBuffer(track.blobId);
            return buf ? { buf, volume: track.volume || 1 } : null;
        })
    );

    const validTracks = loadedTracks.filter(Boolean);

    // Neue Tracks starten (gain startet bei 0)
    const newSources = [];
    const newGains = [];
    validTracks.forEach(function(t) {
        const pair = playTrack(t.buf, t.volume);
        newSources.push(pair.source);
        newGains.push(pair.gain);
    });

    // Crossfade
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Alte Tracks ausblenden
    oldGains.forEach(function(g) {
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.linearRampToValueAtTime(0, now + CROSSFADE_DURATION);
    });
    oldSources.forEach(function(src) {
        try { src.stop(now + CROSSFADE_DURATION + 0.1); } catch (e) { /* bereits gestoppt */ }
    });

    // Neue Tracks einblenden
    newGains.forEach(function(g) {
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(
            _muteActive ? 0 : (g.targetVolume || 1),
            now + CROSSFADE_DURATION
        );
    });

    // Aktive Szene ersetzen
    _activeScene = { sources: newSources, gains: newGains, muted: _muteActive };
}

/**
 * stopAllTracks() — Alle aktiven Tracks sofort stoppen und Szene leeren.
 */
function stopAllTracks() {
    const ctx = _soundboardAudioContext;
    const now = ctx ? ctx.currentTime : 0;
    _activeScene.sources.forEach(function(src) {
        try { src.stop(now); } catch (e) { /* bereits gestoppt */ }
    });
    _activeScene = { sources: [], gains: [], muted: false };
    _muteActive = false;
}

/**
 * toggleSoundboardMute() — Alle aktiven Tracks stummschalten / wieder einschalten.
 * Nutzt linearRampToValueAtTime fuer einen weichen Fade (0.3s).
 */
function toggleSoundboardMute() {
    if (!_soundboardAudioContext) return;
    const ctx = _soundboardAudioContext;
    const now = ctx.currentTime;
    const MUTE_FADE = 0.3;

    if (!_muteActive) {
        // Stummschalten: Lautstaerken speichern, auf 0 rampen
        _premuteVolumes = _activeScene.gains.map(function(g) { return g.gain.value; });
        _activeScene.gains.forEach(function(g) {
            g.gain.setValueAtTime(g.gain.value, now);
            g.gain.linearRampToValueAtTime(0, now + MUTE_FADE);
        });
        _muteActive = true;
    } else {
        // Lautstaerke wiederherstellen
        _activeScene.gains.forEach(function(g, i) {
            const targetVol = (_premuteVolumes[i] !== undefined) ? _premuteVolumes[i] : (g.targetVolume || 1);
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(targetVol, now + MUTE_FADE);
        });
        _muteActive = false;
        _premuteVolumes = [];
    }
}

// Exports (07-03 Keyboard-Slots + UI rufen diese auf)
window.activateSoundScene = activateSoundScene;
window.stopAllTracks = stopAllTracks;
window.toggleSoundboardMute = toggleSoundboardMute;
window.getAudioContext = getAudioContext;
