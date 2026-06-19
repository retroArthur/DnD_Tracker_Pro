// [SECTION:SOUNDBOARD_IDB]
// IDB-Helper fuer Soundboard-Audio-Blobs (Phase 7 — UX-01, D-01)
// Persistiert Audio-Blobs im IndexedDB-Store 'audioBlobs' (IDB v4).
// Kein Schreiben in D, Undo oder Exports — nur IDB (D-01).

// Size thresholds (D-01a)
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;      // 20 MB — soft warn
const MAX_AUDIO_BYTES_HARD = 100 * 1024 * 1024; // 100 MB — hard block (T-07-AUDIO-DOS)

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
    return new Promise((resolve, reject) => {
        const entry = {
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            blob: file,
            savedAt: Date.now()
        };
        const tx = window.idb.transaction(['audioBlobs'], 'readwrite');
        const store = tx.objectStore('audioBlobs');
        store.put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
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
 * @returns {Promise<Array<{id, name, size, type, savedAt}>>}
 */
async function listSoundBlobs() {
    await window.initIndexedDB();
    return new Promise((resolve, reject) => {
        const tx = window.idb.transaction(['audioBlobs'], 'readonly');
        const store = tx.objectStore('audioBlobs');
        const req = store.getAll();
        req.onsuccess = () => {
            // Blob-Bytes aus der Liste entfernen — nur Metadaten
            const records = (req.result || []).map(function(entry) {
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
 * deleteSoundBlob(id) — Blob aus IDB entfernen.
 * @returns {Promise<void>}
 */
async function deleteSoundBlob(id) {
    await window.initIndexedDB();
    return new Promise((resolve, reject) => {
        const tx = window.idb.transaction(['audioBlobs'], 'readwrite');
        const store = tx.objectStore('audioBlobs');
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Exports
window.saveSoundBlob = saveSoundBlob;
window.getSoundBlob = getSoundBlob;
window.deleteSoundBlob = deleteSoundBlob;
window.listSoundBlobs = listSoundBlobs;
window.checkAudioFileSize = checkAudioFileSize;
window.MAX_AUDIO_BYTES = MAX_AUDIO_BYTES;
