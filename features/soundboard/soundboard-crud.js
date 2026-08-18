// [SECTION:SOUNDBOARD_CRUD]
// Scene CRUD + Audio Import fuer Soundboard (Phase 7 — UX-01, D-02, D-03)
// Implementiert in 07-03.
//
// SECURITY:
//   T-07-AUDIO-DOS  — checkAudioFileSize block-before-write in importAudioFile
//   T-07-DEDUP      — kein `var X = window.X` fuer const-Globals
// DATA CONTRACT:
//   D.soundboard.scenes = [{ id, name, slot, tracks:[{ blobId, volume }] }]
//   Audio-Blobs NIE in D — nur in IDB audioBlobs-Store (D-01)

// ============================================================
// Audio-Bibliothek — Import / Remove
// ============================================================

/**
 * importAudioFile(fileOrEvent) — Datei aus <input type="file"> in IDB speichern.
 * Ruft checkAudioFileSize auf; block => Error-Toast + Abbruch (T-07-AUDIO-DOS).
 * warn => Warning-Toast, aber Speicherung wird fortgesetzt.
 *
 * @param {File|Event} fileOrEvent — File-Objekt oder change-Event vom Input
 * @returns {Promise<void>}
 */
async function importAudioFile(fileOrEvent) {
    // Hole File-Objekt aus Event, Input-Element oder direkt
    let file = fileOrEvent;
    if (fileOrEvent && fileOrEvent.target && fileOrEvent.target.files) {
        // Wurde ein DOM-Event uebergeben (Event.target = <input>)
        file = fileOrEvent.target.files[0];
    } else if (fileOrEvent && fileOrEvent.files) {
        // Wurde direkt das Input-Element uebergeben (ctx.target = <input>)
        file = fileOrEvent.files[0];
    }
    if (!file) return;

    // Groessen-Pruefung ZUERST (T-07-AUDIO-DOS)
    const check = window.checkAudioFileSize(file.size);
    if (check.block) {
        showToast(check.message, 'error');
        return; // Hard block — kein IDB-Write
    }
    if (check.warn) {
        showToast(check.message, 'warning');
        // Warnung anzeigen, aber Import trotzdem fortsetzen
    }

    // ID generieren: Timestamp + Zufallszahl (keine externen Libs)
    const id = 'audio_' + Date.now() + '_' + Math.floor(Math.random() * 100000);

    try {
        await window.saveSoundBlob(id, file);
        showToast('Audio gespeichert: ' + file.name);
        // Render neu aufrufen wenn verfuegbar
        if (typeof window.renderAudioLibrary === 'function') {
            window.renderAudioLibrary();
        }
    } catch (err) {
        showToast('Fehler beim Speichern: ' + (err && err.message ? err.message : 'Unbekannt'), 'error');
    }
}

/**
 * removeAudioFile(id) — Blob per Grabstein aufgeschoben "loeschen" (SAFE-03).
 * saveUndoState() sichert ausschliesslich window.D, niemals den IDB-Inhalt — deshalb
 * loescht diese Funktion den Blob nicht sofort, sondern versieht ihn ueber
 * softDeleteSoundBlob() nur mit einem Grabstein. Ohne diesen Umweg wuerde Strg+Z nur die
 * Szenen-Referenz zurueckholen, waehrend die Datei selbst unwiederbringlich weg waere —
 * genau die "defekten Szenen", die SAFE-03 verhindern soll. Der registrierte Undo-Hook
 * _onUndoAudioDelete() holt die Datei bei Strg+Z ueber restoreSoundBlob() zurueck.
 * Entfernt den blobId ausserdem aus allen Szenen-Tracks die darauf verweisen.
 *
 * @param {string} id — Blob-ID
 * @returns {Promise<void>}
 */
async function removeAudioFile(id) {
    if (!id) return;

    // saveUndoState() MUSS vor jeder Mutation laufen — sonst enthaelt die Momentaufnahme
    // von window.D bereits die folgende Scene-Track-Bereinigung (CLAUDE.md: immer
    // saveUndoState() vor destruktiven Operationen).
    if (typeof window.saveUndoState === 'function') {
        window.saveUndoState('Audio entfernt');
    }

    try {
        await window.softDeleteSoundBlob(id);
        _audioDeleteJournal.push({ id: id, undone: false });
        if (_audioDeleteJournal.length > _AUDIO_JOURNAL_LIMIT) {
            _audioDeleteJournal.shift();
        }

        // Aus allen Szenen-Tracks entfernen (Referenz-Bereinigung)
        if (window.D && window.D.soundboard && Array.isArray(window.D.soundboard.scenes)) {
            const activeId = (typeof window.getActiveSceneId === 'function') ? window.getActiveSceneId() : null;
            let changed = false;
            let activeChanged = false;
            window.D.soundboard.scenes.forEach(function(scene) {
                if (!Array.isArray(scene.tracks)) return;
                const before = scene.tracks.length;
                scene.tracks = scene.tracks.filter(function(t) { return t.blobId !== id; });
                if (scene.tracks.length !== before) {
                    changed = true;
                    if (activeId && scene.id === activeId) activeChanged = true;
                }
            });
            // Spielt eine Szene, die diese Datei nutzte → Audio stoppen (Quelle ist weg)
            if (activeChanged && typeof window.stopAllTracks === 'function') window.stopAllTracks();
            if (changed) {
                if (typeof window.save === 'function') window.save();
            }
        }

        showToast('Audio entfernt');
        if (typeof window.renderAudioLibrary === 'function') {
            window.renderAudioLibrary();
        }
    } catch (err) {
        showToast('Fehler beim Entfernen', 'error');
    }
}

// ============================================================
// Undo-Journal fuer removeAudioFile() (Plan 12-06, SAFE-03)
// ============================================================
// Grabstein-Design (siehe removeAudioFile() oben): das Journal merkt sich, welche
// zuletzt entfernten Dateien noch "undone: false" (also weiterhin per Grabstein entfernt)
// sind. Der Undo-Hook _onUndoAudioDelete() läuft rückwärts durch dieses Journal (LIFO —
// zuletzt entfernt wird zuerst wiederhergestellt), Redo vorwärts (FIFO unter den bereits
// wiederhergestellten Einträgen). Länge auf UNDO_LIMIT begrenzt — ältere Einträge fallen
// vorne heraus; deren Grabsteine räumt das Sitzungs-Aufräumen in soundboard-idb.js beim
// nächsten App-Start ab.
const _audioDeleteJournal = [];
const _AUDIO_JOURNAL_LIMIT = window.APP_CONFIG?.UNDO_LIMIT || 30;

/**
 * _onUndoAudioDelete(info) — Undo-Hook-Konsument (registriert via window.registerUndoHook,
 * systems/undo.js, Plan 12-05). Reagiert ausschliesslich auf das Aktionslabel
 * 'Audio entfernt' — jedes andere Label laesst die Datenbank unberuehrt.
 *
 * @param {{action: string, direction: 'undo'|'redo'}} info
 */
async function _onUndoAudioDelete(info) {
    if (!info || info.action !== 'Audio entfernt') return;

    try {
        if (info.direction === 'undo') {
            // Rückwärts durch das Journal — zuletzt entfernte Datei zuerst zurückholen.
            for (let i = _audioDeleteJournal.length - 1; i >= 0; i--) {
                const entry = _audioDeleteJournal[i];
                if (!entry.undone) {
                    await window.restoreSoundBlob(entry.id);
                    entry.undone = true;
                    break;
                }
            }
        } else if (info.direction === 'redo') {
            // Vorwärts durch das Journal — entgegengesetztes Ende von undo() (siehe oben).
            for (let i = 0; i < _audioDeleteJournal.length; i++) {
                const entry = _audioDeleteJournal[i];
                if (entry.undone) {
                    await window.softDeleteSoundBlob(entry.id);
                    entry.undone = false;
                    break;
                }
            }
        }
    } catch (err) {
        if (window.APP_CONFIG?.DEBUG_MODE && window.ErrorHandler) {
            window.ErrorHandler.log('_onUndoAudioDelete', err, info && info.direction);
        }
    }

    // Bibliothek unabhaengig vom Ausgang neu rendern, damit sie den aktuellen Stand zeigt.
    if (typeof window.renderAudioLibrary === 'function') {
        window.renderAudioLibrary();
    }
}
if (typeof window.registerUndoHook === 'function') {
    window.registerUndoHook(_onUndoAudioDelete);
}

// ============================================================
// D.soundboard Initialisierung
// ============================================================

/**
 * Stellt sicher, dass D.soundboard.scenes existiert.
 * Szenen sind triviale Konfigurations-Objekte — kein Undo noetig (consistent with
 * Inspiration/leveling-mode precedent).
 */
function ensureSoundboardData() {
    if (!window.D.soundboard) {
        window.D.soundboard = { scenes: [] };
    }
    if (!Array.isArray(window.D.soundboard.scenes)) {
        window.D.soundboard.scenes = [];
    }
}

// ============================================================
// Scene CRUD
// ============================================================

/**
 * createScene(name, slot) — Neue Szene anlegen.
 * slot = 1..5 fuer Alt+Shift+N-Quick-Slots (0 = kein Slot).
 *
 * @param {string} name
 * @param {number} [slot=0]
 * @returns {{ id: string, name: string, slot: number, tracks: Array }}
 */
function createScene(name, slot) {
    ensureSoundboardData();
    const id = 'scene_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
    const scene = {
        id,
        name: name || 'Neue Szene',
        slot: typeof slot === 'number' && slot >= 0 && slot <= 5 ? slot : 0,
        tracks: []
    };
    window.D.soundboard.scenes.push(scene);
    if (typeof window.save === 'function') window.save();
    return scene;
}

/**
 * renameScene(sceneId, newName) — Szene umbenennen.
 */
function renameScene(sceneId, newName) {
    ensureSoundboardData();
    const scene = window.D.soundboard.scenes.find(function(s) { return s.id === sceneId; });
    if (!scene) return;
    scene.name = newName || scene.name;
    if (typeof window.save === 'function') window.save();
}

/**
 * deleteScene(sceneId) — Szene loeschen (kein Undo — triviale Konfig).
 */
function deleteScene(sceneId) {
    ensureSoundboardData();
    // Laufendes Audio dieser Szene stoppen — sonst spielt der Loop nach dem Löschen weiter
    if (typeof window.stopAllTracksIfScene === 'function') window.stopAllTracksIfScene(sceneId);
    window.D.soundboard.scenes = window.D.soundboard.scenes.filter(function(s) {
        return s.id !== sceneId;
    });
    if (typeof window.save === 'function') window.save();
}

/**
 * addTrackToScene(sceneId, blobId, volume) — Track zu Szene hinzufuegen.
 * volume: 0..1 (Default 0.8)
 */
function addTrackToScene(sceneId, blobId, volume) {
    ensureSoundboardData();
    const scene = window.D.soundboard.scenes.find(function(s) { return s.id === sceneId; });
    if (!scene) return;
    if (!Array.isArray(scene.tracks)) scene.tracks = [];
    // Doppelten blobId verhindern
    if (scene.tracks.some(function(t) { return t.blobId === blobId; })) {
        showToast('Track bereits in dieser Szene');
        return;
    }
    const vol = (typeof volume === 'number' && volume >= 0 && volume <= 1) ? volume : 0.8;
    scene.tracks.push({ blobId, volume: vol, loop: true });
    if (typeof window.save === 'function') window.save();
}

/**
 * setTrackLoop(sceneId, blobId, loop) — Loop-Flag eines Tracks setzen oder umschalten.
 * Ohne `loop`-Argument wird umgeschaltet (Default-Zustand ist Loop an).
 * Wirkt beim naechsten Play der Szene (kein Live-Umschalten im laufenden Loop).
 *
 * @param {string} sceneId
 * @param {string} blobId
 * @param {boolean} [loop]  explizit setzen; weggelassen => umschalten
 * @returns {boolean|undefined} der neue Loop-Zustand
 */
function setTrackLoop(sceneId, blobId, loop) {
    ensureSoundboardData();
    const scene = window.D.soundboard.scenes.find(function(s) { return s.id === sceneId; });
    if (!scene || !Array.isArray(scene.tracks)) return;
    const track = scene.tracks.find(function(t) { return t.blobId === blobId; });
    if (!track) return;
    if (typeof loop === 'boolean') {
        track.loop = loop;
    } else {
        // Default-Zustand ist Loop an (undefined === true) -> Umschalten
        track.loop = track.loop === false ? true : false;
    }
    if (typeof window.save === 'function') window.save();
    return track.loop;
}

/**
 * removeTrackFromScene(sceneId, blobId) — Track aus Szene entfernen.
 */
function removeTrackFromScene(sceneId, blobId) {
    ensureSoundboardData();
    const scene = window.D.soundboard.scenes.find(function(s) { return s.id === sceneId; });
    if (!scene || !Array.isArray(scene.tracks)) return;
    scene.tracks = scene.tracks.filter(function(t) { return t.blobId !== blobId; });
    // Spielt diese Szene gerade, würde der entfernte Track weiterlaufen → Audio stoppen
    if (typeof window.stopAllTracksIfScene === 'function') window.stopAllTracksIfScene(sceneId);
    if (typeof window.save === 'function') window.save();
}

/**
 * setTrackVolume(sceneId, blobId, volume) — Lautstaerke eines Tracks setzen.
 * volume: 0..1
 */
function setTrackVolume(sceneId, blobId, volume) {
    ensureSoundboardData();
    const scene = window.D.soundboard.scenes.find(function(s) { return s.id === sceneId; });
    if (!scene || !Array.isArray(scene.tracks)) return;
    const track = scene.tracks.find(function(t) { return t.blobId === blobId; });
    if (!track) return;
    const vol = Math.max(0, Math.min(1, parseFloat(volume) || 0));
    track.volume = vol;
    // Live an den laufenden Track durchreichen (kein Stop/Neustart nötig)
    if (typeof window.setLiveTrackVolume === 'function') window.setLiveTrackVolume(sceneId, blobId, vol);
    if (typeof window.save === 'function') window.save();
}

// ============================================================
// Scene Playback
// ============================================================

/**
 * playSceneById(sceneId) — Szene abspielen via activateSoundScene.
 * Wandelt die scene.tracks-Konfig in das activateSoundScene-Format um.
 */
async function playSceneById(sceneId) {
    ensureSoundboardData();
    const scene = window.D.soundboard.scenes.find(function(s) { return s.id === sceneId; });
    if (!scene) {
        showToast('Szene nicht gefunden', 'error');
        return;
    }
    if (!Array.isArray(scene.tracks) || scene.tracks.length === 0) {
        showToast('Szene hat keine Tracks', 'warning');
        return;
    }
    if (typeof window.activateSoundScene === 'function') {
        await window.activateSoundScene({ sceneId: scene.id, tracks: scene.tracks });
    } else {
        showToast('Audio-Engine nicht verfuegbar', 'error');
    }
}

/**
 * activateSceneBySlot(slot) — Szene per Quick-Slot (1..5) aktivieren (D-03 Keyboard).
 * Wird von keyboard-shortcuts.js aufgerufen.
 */
async function activateSceneBySlot(slot) {
    ensureSoundboardData();
    const scene = window.D.soundboard.scenes.find(function(s) {
        return s.slot === slot;
    });
    if (!scene) {
        // Keine Szene in diesem Slot — still ignorieren
        return;
    }
    await playSceneById(scene.id);
}

// ============================================================
// Exports
// ============================================================
window.importAudioFile = importAudioFile;
window.removeAudioFile = removeAudioFile;
window.createScene = createScene;
window.renameScene = renameScene;
window.deleteScene = deleteScene;
window.addTrackToScene = addTrackToScene;
window.removeTrackFromScene = removeTrackFromScene;
window.setTrackVolume = setTrackVolume;
window.setTrackLoop = setTrackLoop;
window.playSceneById = playSceneById;
window.activateSceneBySlot = activateSceneBySlot;
window.ensureSoundboardData = ensureSoundboardData;
