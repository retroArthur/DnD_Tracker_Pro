// [SECTION:SOUNDBOARD_IDB]
// IDB-Helper fuer Soundboard-Audio-Blobs (Phase 7 — UX-01, D-01)
// Persistiert Audio-Blobs im IndexedDB-Store 'audioBlobs' (IDB v4).
// Kein Schreiben in D, Undo oder Exports — nur IDB (D-01).

// Size thresholds (D-01a)
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;      // 20 MB — soft warn
const MAX_AUDIO_BYTES_HARD = 100 * 1024 * 1024; // 100 MB — hard block (T-07-AUDIO-DOS)

// Sitzungs-Start — Modulkonstante, gesetzt beim Laden dieser Datei (App-Boot).
// Grundlage fuer _cleanupStaleTombstones() weiter unten (SAFE-03, T-12-20).
const _sbSessionStart = Date.now();
let _sbSessionCleanupDone = false;

/**
 * checkAudioFileSize(sizeBytes) — Pure helper (no side effects).
 * Returns { ok, warn, block, message }.
 * - ok: size is within soft limit (no warning)
 * - warn: size > MAX_AUDIO_BYTES (20 MB) but <= MAX_AUDIO_BYTES_HARD
 * - block: size > MAX_AUDIO_BYTES_HARD (100 MB) — file must NOT be saved
 */
function checkAudioFileSize(sizeBytes) {
    if (sizeBytes > MAX_AUDIO_BYTES_HARD) {
        return {
            ok: false,
            warn: false,
            block: true,
            message: 'Datei zu groß (max. 100 MB). Import abgebrochen.'
        };
    }
    if (sizeBytes > MAX_AUDIO_BYTES) {
        return {
            ok: false,
            warn: true,
            block: false,
            message: 'Datei ist größer als 20 MB. Für beste Performance MP3/OGG empfohlen.'
        };
    }
    return { ok: true, warn: false, block: false, message: '' };
}

/**
 * saveSoundBlob(id, file) — Blob in IDB audioBlobs-Store speichern.
 * Bricht ab (kein IDB-Write) wenn file.size > MAX_AUDIO_BYTES_HARD (T-07-AUDIO-DOS).
 * @param {string} id   - eindeutiger Bezeichner (z.B. UUID oder Dateiname-Hash)
 * @param {File|Blob}  file - Das Audio-File-Objekt vom Datei-Picker
 * @returns {Promise<void>}
 */
async function saveSoundBlob(id, file) {
    const check = checkAudioFileSize(file.size);
    if (check.block) {
        if (typeof showToast === 'function') showToast(check.message, 'error');
        return Promise.reject(new Error(check.message));
    }
    if (check.warn && typeof showToast === 'function') {
        showToast(check.message, 'warning');
    }

    await window.initIndexedDB();
    const entry = {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        blob: file,
        savedAt: Date.now()
    };
    // R04: erst nach bestaetigtem Commit aufloesen; ein Commit-Abbruch (grosser Blob, Quota)
    // lehnt ab, statt ewig zu haengen
    await window.idbWriteTx(['audioBlobs'], tx => {
        tx.objectStore('audioBlobs').put(entry);
    });
}

/**
 * getSoundBlob(id) — Blob aus IDB laden.
 * @returns {Promise<Blob|null>}
 */
async function getSoundBlob(id) {
    await window.initIndexedDB();
    return new Promise((resolve, reject) => {
        const tx = window.idb.transaction(['audioBlobs'], 'readonly');
        const store = tx.objectStore('audioBlobs');
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result ? req.result.blob : null);
        req.onerror = () => reject(req.error);
    });
}

/**
 * listSoundBlobs() — Metadaten aller gespeicherten Blobs zurueckgeben (OHNE Blob-Bytes).
 * Grabsteine (deletedAt gesetzt, siehe softDeleteSoundBlob) werden herausgefiltert — eine
 * aufgeschoben geloeschte Datei verschwindet damit sofort aus Bibliothek und Szenenliste,
 * genau wie bei einer sofortigen Loeschung. Beim ersten Aufruf der Sitzung raeumt diese
 * Funktion zusaetzlich alle Grabsteine frueherer Sitzungen endgueltig weg (SAFE-03,
 * T-12-20) — siehe _cleanupStaleTombstones().
 * @returns {Promise<Array<{id, name, size, type, savedAt}>>}
 */
async function listSoundBlobs() {
    await window.initIndexedDB();
    if (!_sbSessionCleanupDone) {
        _sbSessionCleanupDone = true;
        await _cleanupStaleTombstones();
    }
    return new Promise((resolve, reject) => {
        const tx = window.idb.transaction(['audioBlobs'], 'readonly');
        const store = tx.objectStore('audioBlobs');
        const req = store.getAll();
        req.onsuccess = () => {
            // Blob-Bytes aus der Liste entfernen — nur Metadaten. Grabsteine ausfiltern.
            const records = (req.result || [])
                .filter(function(entry) { return !entry.deletedAt; })
                .map(function(entry) {
                    return {
                        id: entry.id,
                        name: entry.name,
                        size: entry.size,
                        type: entry.type,
                        savedAt: entry.savedAt
                    };
                });
            resolve(records);
        };
        req.onerror = () => reject(req.error);
    });
}

/**
 * deleteSoundBlob(id) — Blob aus IDB entfernen (sofort, endgueltig).
 * Bleibt unveraendert der Weg fuer harte Loeschung — genutzt vom Sitzungs-Aufraeumen
 * (_cleanupStaleTombstones) und von der bestehenden E2E-Suite, die sich darauf verlaesst.
 * removeAudioFile() (soundboard-crud.js) nutzt seit Plan 12-06 stattdessen
 * softDeleteSoundBlob(), damit Strg+Z die Datei zurueckholen kann.
 * @returns {Promise<void>}
 */
async function deleteSoundBlob(id) {
    await window.initIndexedDB();
    await window.idbWriteTx(['audioBlobs'], tx => {
        tx.objectStore('audioBlobs').delete(id);
    });
}

/**
 * softDeleteSoundBlob(id) — Blob NICHT loeschen, sondern mit einem Grabstein (deletedAt)
 * versehen (SAFE-03, T-12-19). Der Blob selbst bleibt vollstaendig und unveraendert in der
 * IDB liegen — genau das macht restoreSoundBlob() ueberhaupt erst moeglich.
 * saveUndoState() (systems/undo.js) sichert ausschliesslich window.D, niemals den
 * IDB-Inhalt; ohne dieses aufgeschobene Loeschen waere die Audiodatei nach Strg+Z
 * unwiederbringlich weg und die Szene wuerde auf eine geloeschte Datei zeigen.
 * Fehlt der Eintrag, wird still aufgeloest (kein Fehler) — konsistent mit dem
 * "nie am Spieltisch blockieren"-Prinzip der uebrigen Undo-Pfade.
 * @param {string} id
 * @returns {Promise<void>}
 */
async function softDeleteSoundBlob(id) {
    await window.initIndexedDB();
    await window.idbWriteTx(['audioBlobs'], tx => {
        const store = tx.objectStore('audioBlobs');
        const getReq = store.get(id);
        getReq.onsuccess = () => {
            const entry = getReq.result;
            if (entry) {
                entry.deletedAt = Date.now();
                store.put(entry);
            }
            // Fehlt der Eintrag: nichts zu tun — Aufloesung nach dem Commit (idbWriteTx)
        };
        // getReq-Fehler blubbert zur Transaktion und laesst idbWriteTx ablehnen
    });
}

/**
 * restoreSoundBlob(id) — Grabstein von einem Blob entfernen (deletedAt loeschen).
 * Der Eintrag erscheint danach wieder in listSoundBlobs(), mit unverändertem Namen, Typ
 * und Groesse — der Blob wurde ja nie angetastet.
 * @param {string} id
 * @returns {Promise<boolean>} true bei Erfolg, false wenn kein Eintrag mit dieser id
 *   existiert (unbekannt oder bereits hart geloescht) — wirft in diesem Fall nicht.
 */
async function restoreSoundBlob(id) {
    await window.initIndexedDB();
    const holder = { found: false };
    await window.idbWriteTx(['audioBlobs'], tx => {
        const store = tx.objectStore('audioBlobs');
        const getReq = store.get(id);
        getReq.onsuccess = () => {
            const entry = getReq.result;
            if (entry) {
                holder.found = true;
                // Nur Grabsteine zurueckschreiben — einen unversehrten (grossen) Blob nicht
                // ohne Not neu speichern
                if (entry.deletedAt) {
                    delete entry.deletedAt;
                    store.put(entry);
                }
            }
        };
    });
    return holder.found;
}

/**
 * _cleanupStaleTombstones() — Grabsteine frueherer Sitzungen endgueltig entfernen
 * (SAFE-03, T-12-20 — unbegrenztes Wachstum verhindern).
 * Der Undo-Stack (systems/undo.js) lebt ausschliesslich im Speicher und ist nach jedem
 * Neuladen leer. Ein Grabstein, dessen deletedAt vor dem Start der laufenden Sitzung
 * liegt, ist damit durch kein Strg+Z mehr erreichbar und nur noch Ballast — er kann
 * gefahrlos hart geloescht werden. Laeuft genau einmal pro Sitzung, ausgeloest vom ersten
 * listSoundBlobs()-Aufruf (siehe _sbSessionCleanupDone). Ein Fehler hier darf
 * listSoundBlobs() nicht blockieren — daher wird nie reject() aufgerufen.
 * @returns {Promise<void>}
 */
async function _cleanupStaleTombstones() {
    return new Promise((resolve) => {
        const tx = window.idb.transaction(['audioBlobs'], 'readonly');
        const store = tx.objectStore('audioBlobs');
        const req = store.getAll();
        req.onsuccess = () => {
            const stale = (req.result || []).filter(function(entry) {
                return entry.deletedAt && entry.deletedAt < _sbSessionStart;
            });
            if (stale.length === 0) {
                resolve();
                return;
            }
            // R04: auch ein Commit-Abbruch ('abort') loest auf — listSoundBlobs() haengt nie
            window
                .idbWriteTx(['audioBlobs'], delTx => {
                    const delStore = delTx.objectStore('audioBlobs');
                    stale.forEach(function(entry) { delStore.delete(entry.id); });
                })
                .then(resolve, resolve);
        };
        req.onerror = () => resolve();
    });
}

// Exports
window.saveSoundBlob = saveSoundBlob;
window.getSoundBlob = getSoundBlob;
window.deleteSoundBlob = deleteSoundBlob;
window.softDeleteSoundBlob = softDeleteSoundBlob;
window.restoreSoundBlob = restoreSoundBlob;
window.listSoundBlobs = listSoundBlobs;
window.checkAudioFileSize = checkAudioFileSize;
window.MAX_AUDIO_BYTES = MAX_AUDIO_BYTES;
