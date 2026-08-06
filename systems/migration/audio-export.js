// [SECTION:AUDIO_EXPORT]
// ============================================================
// Zweite Export-Datei fuer IndexedDB-Inhalte (Audio + Wuerfelstatistik)
// Implementierung: Phase 12, Plan 01 (D-01/D-02/D-08)
// Analog: systems/migration/full-export.js (Schema, Download-/Import-Muster)
//
// Warum eine ZWEITE Datei (D-01): Der Haupt-Export (full-export.js) bleibt
// strukturell unveraendert — JSON.stringify ueber die localStorage-Felder.
// IndexedDB-Inhalte (Audio-Blobs, Wuerfelstatistik) kommen in eine eigene
// Datei mit eigener Versionskennung. Fehlt sie beim Import, blockiert das
// den Hauptimport NICHT (D-02) — der Umzug file:// -> PWA laeuft nur einmal.
// ============================================================

// Schema fuer die Audio-Export-Datei — strikt getrennt von FULL_EXPORT_SCHEMA
const AUDIO_EXPORT_SCHEMA = {
    _exportType: 'audio-export-v1',
    fields: {
        audioFiles: { type: 'array', required: true }, // [{ id, name, type, size, data(base64) }]
        diceStats: { type: 'array', required: false, default: [] }
    }
};

// ============================================================
// Blob <-> Base64 (kein Runtime-Dependency, D-01)
// ============================================================

/**
 * blobToBase64(blob) — Blob als reinen Base64-String liefern (ohne Data-URL-Praefix).
 * Nutzt FileReader.readAsDataURL — NIEMALS String.fromCharCode.apply ueber ein
 * Byte-Array bauen, das wirft bei 20-100 MB Audiodateien zuverlaessig
 * RangeError: Maximum call stack size exceeded.
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result; // "data:audio/mpeg;base64,AAAA..."
            const komma = dataUrl.indexOf(',');
            resolve(komma >= 0 ? dataUrl.substring(komma + 1) : dataUrl);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

/**
 * base64ToBlob(base64, type) — Base64-String zurueck in einen Blob wandeln.
 * atob() wirft InvalidCharacterError bei manipulierten Zeichen — Aufrufer
 * (importAudioExport) faengt das PRO Datei ab, nicht global (D-02-Prinzip).
 * @param {string} base64
 * @param {string} type - MIME-Type des Ergebnis-Blobs
 * @returns {Blob}
 */
function base64ToBlob(base64, type) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: type });
}

// ============================================================
// BUILD — Audio-Export-Objekt erstellen
// ============================================================

/**
 * buildAudioExport() — Sammelt alle IDB-Audiodateien (Base64) + die vollstaendige
 * Wuerfelstatistik in ein Export-Objekt.
 *
 * Ein Metadaten-Eintrag ohne ladbaren Blob wird uebersprungen (defensiv), nicht als
 * Abbruchgrund behandelt — die uebrigen Dateien werden trotzdem exportiert.
 *
 * diceStats wird VOLLSTAENDIG uebernommen (kein Cap): die Begrenzung des Stores ist
 * PERF-02 (Phase 13) — zwei konkurrierende Capping-Mechanismen waeren genau der
 * Fehler, den wir vermeiden wollen. Sollte PERF-02 spaeter ein Pruning einfuehren,
 * exportiert dieser Code automatisch nur noch die dann vorhandenen Datensaetze, ohne
 * selbst geaendert werden zu muessen.
 *
 * @returns {Promise<Object>}
 */
async function buildAudioExport() {
    const metas = (typeof window.listSoundBlobs === 'function')
        ? await window.listSoundBlobs()
        : [];

    const audioFiles = [];
    for (const meta of metas) {
        const blob = (typeof window.getSoundBlob === 'function')
            ? await window.getSoundBlob(meta.id)
            : null;
        if (!blob) continue; // Meta ohne Blob: ueberspringen, nicht abbrechen

        const base64 = await blobToBase64(blob);
        audioFiles.push({
            id: meta.id,
            name: meta.name,
            type: meta.type,
            size: meta.size,
            data: base64
        });
    }

    const diceStats = (typeof window.getAllStats === 'function')
        ? await window.getAllStats()
        : [];

    return {
        _exportType: 'audio-export-v1',
        _appVersion: APP_CONFIG.VERSION,
        _exportDate: new Date().toISOString(),
        audioFiles: audioFiles,
        diceStats: diceStats
    };
}

// ============================================================
// DOWNLOAD — Blob + Anchor-Download (Muster: downloadFullExport in full-export.js)
// ============================================================
async function downloadAudioExport() {
    try {
        const exportObj = await buildAudioExport();
        const json = JSON.stringify(exportObj, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const datum = new Date().toISOString().split('T')[0];
        a.download = 'dnd-tracker-audio-umzug-' + datum + '.json';
        a.click();
        URL.revokeObjectURL(url);
        if (typeof window.showToast === 'function') {
            window.showToast('Audio-Export heruntergeladen');
        }
    } catch (err) {
        if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.DEBUG_MODE && window.ErrorHandler) {
            window.ErrorHandler.log('downloadAudioExport', err, 'Audio-Export fehlgeschlagen');
        }
        if (typeof window.showToast === 'function') {
            window.showToast('Audio-Export fehlgeschlagen: ' + err.message, 'error');
        }
    }
}

// ============================================================
// IMPORT — Audio-Dateien zurueck nach IndexedDB schreiben (D-02: benannt, nicht blockierend)
// ============================================================

/**
 * importAudioExport(parsedObj) — Schreibt jede Datei per saveSoundBlob() zurueck nach
 * IndexedDB. Ein Eintrag mit kaputtem Base64 kostet nur diesen einen Eintrag (D-02) —
 * die uebrigen Dateien werden trotzdem importiert.
 *
 * @param {Object} parsedObj
 * @returns {Promise<{ imported: number, skipped: Array<{id, name, grund}> }>}
 */
async function importAudioExport(parsedObj) {
    if (!parsedObj || parsedObj._exportType !== 'audio-export-v1') {
        throw new Error('Ungueltige Datei — kein audio-export-v1-Export');
    }

    const audioFiles = Array.isArray(parsedObj.audioFiles) ? parsedObj.audioFiles : [];

    let imported = 0;
    const skipped = [];

    for (const entry of audioFiles) {
        try {
            const blob = base64ToBlob(entry.data, entry.type);
            let fileLike;
            if (typeof File === 'function') {
                fileLike = new File([blob], entry.name, { type: entry.type });
            } else {
                // Fallback: Blob mit angehaengtem name (saveSoundBlob liest file.name)
                fileLike = blob;
                fileLike.name = entry.name;
            }

            if (typeof window.saveSoundBlob === 'function') {
                await window.saveSoundBlob(entry.id, fileLike);
            }
            imported++;
        } catch (e) {
            skipped.push({
                id: entry && entry.id,
                name: entry && entry.name,
                grund: (e && e.message) ? e.message : 'Unbekannter Fehler'
            });
        }
    }

    return { imported: imported, skipped: skipped };
}

// ============================================================
// EXPORTS
// ============================================================
window.AUDIO_EXPORT_SCHEMA = AUDIO_EXPORT_SCHEMA;
window.blobToBase64 = blobToBase64;
window.base64ToBlob = base64ToBlob;
window.buildAudioExport = buildAudioExport;
window.downloadAudioExport = downloadAudioExport;
window.importAudioExport = importAudioExport;
