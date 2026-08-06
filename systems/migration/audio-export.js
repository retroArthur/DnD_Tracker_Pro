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

// T-12-04: Sicherheitsabstand VOR dem Base64-Encode (Vorab-Metadaten-Pruefung).
// V8s String-Obergrenze liegt bei 0x1fffffe8 = 536.870.888 Zeichen (2^29-24, ~512 MiB).
// Base64 blaeht Rohdaten um Faktor 4/3 auf — die Kodierung scheitert also bereits bei
// ~384 MiB Rohdaten mit RangeError: Invalid string length. Dann ist nicht die eine zu
// grosse Datei kaputt, sondern der GESAMTE Audio-Export. 300 MiB ist der konservative
// Sicherheitsabstand fuer Browser-Speicherdruck (gemessen: 12-RESEARCH.md "Base64-
// Praxisgrenze").
const AUDIO_EXPORT_SAFE_RAW_BYTES = 300 * 1024 * 1024;

// T-12-01: Mengenlimit fuer den Import — analog MAX_IMPORT_CAMPAIGNS in full-export.js.
const MAX_IMPORT_AUDIO_FILES = 500;

// T-12-02: Whitelist fuer importierte blobIds — saveSoundBlob()-ids entstehen in
// soundboard-crud.js im Format 'audio_<timestamp>_<random>' (importAudioFile()).
// Alles andere aus einer nicht vertrauenswuerdigen Datei wird uebersprungen, NIE als
// IDB-Key verwendet.
const ALLOWED_BLOB_ID_RE = /^audio_\d+_\d+$/;

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
 * computeFeasibility(metas) — reine Funktion: summiert Metadaten-Groessen und
 * entscheidet, ob ein Base64-Export sicher moeglich ist. Laedt selbst KEINE Blobs.
 * @param {Array<{size?: number, name?: string}>} metas
 * @returns {{ feasible: boolean, totalBytes: number, fileCount: number, names: string[] }}
 */
function computeFeasibility(metas) {
    const list = Array.isArray(metas) ? metas : [];
    const totalBytes = list.reduce((sum, m) => sum + (m && m.size || 0), 0);
    return {
        feasible: totalBytes <= AUDIO_EXPORT_SAFE_RAW_BYTES,
        totalBytes: totalBytes,
        fileCount: list.length,
        names: list.map(m => m && m.name)
    };
}

/**
 * checkAudioExportFeasible() — Vorab-Pruefung NUR anhand der Metadaten aus
 * listSoundBlobs() (liefert size OHNE Blob-Bytes — praktisch kostenlos). Laedt keinen
 * einzigen Blob. buildAudioExport() ruft dies als allererstes auf, DAMIT der
 * RangeError aus einem zu grossen JSON.stringify gar nicht erst geworfen wird
 * (T-12-04) — eine Pruefung danach kaeme zu spaet.
 * @returns {Promise<{ feasible: boolean, totalBytes: number, fileCount: number, names: string[] }>}
 */
async function checkAudioExportFeasible() {
    const metas = (typeof window.listSoundBlobs === 'function')
        ? await window.listSoundBlobs()
        : [];
    return computeFeasibility(metas);
}

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
 * KEIN Teilexport bei Ueberschreitung der Groessengrenze (T-12-04) — ein halber
 * Audio-Export wuerde eine neue, nirgends spezifizierte Datenverlust-Klasse einfuehren.
 *
 * @returns {Promise<Object>}
 */
async function buildAudioExport() {
    const metas = (typeof window.listSoundBlobs === 'function')
        ? await window.listSoundBlobs()
        : [];

    // T-12-04: Groessenpruefung VOR dem ersten Kodierschritt — billig (nur Metadaten),
    // verhindert den RangeError, der sonst erst NACH teurem Base64-Encode aufträte.
    const feasibility = computeFeasibility(metas);
    if (!feasibility.feasible) {
        const mb = (feasibility.totalBytes / (1024 * 1024)).toFixed(1);
        throw new Error(
            'Audio-Bibliothek zu groß für Export: ' + mb + ' MB von ' +
            feasibility.fileCount + ' Dateien — Export übersprungen, betroffen: ' +
            feasibility.names.join(', ')
        );
    }

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
// Plan 12-02, Task 1: Hinweis-Toast vor dem Bauen + Sonderfall "leere Bibliothek".
// ============================================================
async function downloadAudioExport() {
    // Hinweis-Toast VOR dem Bauen: FileReader, JSON.stringify und die
    // Blob-Konstruktion blockieren den Hauptthread fuer ihre Dauer — bei 100 MB
    // Rohdaten sind allein fuer JSON.stringify ~79ms gemessen, mit Kodierung und
    // Blob-Bau kommen leicht Sekunden zusammen. Ohne Hinweis wirkt das am
    // Spieltisch wie ein Absturz.
    if (typeof window.showToast === 'function') {
        window.showToast('Audio-Export wird erstellt — bei großen Bibliotheken dauert das einen Moment');
    }

    try {
        const exportObj = await buildAudioExport();

        // Sonderfall "leere Bibliothek": weder Audiodateien noch Wuerfelstatistik
        // vorhanden -> KEIN Download, KEIN weiterer Toast (still bleiben). Eine
        // leere zweite Datei wuerde beim einmaligen Umzug nur die Frage aufwerfen,
        // ob etwas schiefging.
        const hasAudio = Array.isArray(exportObj.audioFiles) && exportObj.audioFiles.length > 0;
        const hasDiceStats = Array.isArray(exportObj.diceStats) && exportObj.diceStats.length > 0;
        if (!hasAudio && !hasDiceStats) {
            return;
        }

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
        // Bei feasible:false wirft buildAudioExport() bereits mit Groesse/Dateizahl/
        // Namen in der Message (computeFeasibility) — hier NUR benannt, NIE
        // weitergeworfen: der Haupt-Export darf unter keinen Umstaenden an der
        // zweiten Datei scheitern (D-02-Prinzip).
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
 * Haertung (Task 3, Threat Register T-12-01/T-12-02/T-12-03):
 * - Mengenlimit MAX_IMPORT_AUDIO_FILES prueft VOR jedem Schreibvorgang (T-12-01).
 * - blobId-Whitelist ALLOWED_BLOB_ID_RE — fremdformatige ids werden uebersprungen und
 *   benannt, NIE als IDB-Key verwendet (T-12-02).
 * - Base64-Dekodierung laeuft PRO Datei in try/catch, nicht in einem globalen
 *   try/catch — eine kaputte Datei darf nicht zum Totalausfall werden (T-12-03, D-02).
 *
 * @param {Object} parsedObj
 * @returns {Promise<{ imported: number, skipped: Array<{id, name, grund}> }>}
 */
async function importAudioExport(parsedObj) {
    if (!parsedObj || parsedObj._exportType !== 'audio-export-v1') {
        throw new Error('Ungueltige Datei — kein audio-export-v1-Export');
    }

    const audioFiles = Array.isArray(parsedObj.audioFiles) ? parsedObj.audioFiles : [];

    // T-12-01: Mengenlimit VOR jedem Schreibvorgang — eine manipulierte Datei darf
    // nicht beliebig viele IDB-Eintraege anlegen.
    if (audioFiles.length > MAX_IMPORT_AUDIO_FILES) {
        throw new Error('Zu viele Audiodateien in der Datei (max ' + MAX_IMPORT_AUDIO_FILES + ')');
    }

    let imported = 0;
    const skipped = [];

    for (const entry of audioFiles) {
        const id = entry && entry.id;

        // T-12-02: blobId-Whitelist — nur echte saveSoundBlob()-ID-Formate zulassen.
        // Fremdformatige ids (z.B. '../../evil', 'dnd-tracker-v4') NIE als IDB-Key
        // verwenden — uebersprungen und benannt statt geschrieben.
        if (typeof id !== 'string' || !ALLOWED_BLOB_ID_RE.test(id)) {
            skipped.push({
                id: id,
                name: entry && entry.name,
                grund: 'Unerwartetes ID-Format'
            });
            continue;
        }

        try {
            const blob = base64ToBlob(entry.data, entry.type); // T-12-03: atob() wirft PRO Datei
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
window.AUDIO_EXPORT_SAFE_RAW_BYTES = AUDIO_EXPORT_SAFE_RAW_BYTES;
window.blobToBase64 = blobToBase64;
window.base64ToBlob = base64ToBlob;
window.checkAudioExportFeasible = checkAudioExportFeasible;
window.buildAudioExport = buildAudioExport;
window.downloadAudioExport = downloadAudioExport;
window.importAudioExport = importAudioExport;
