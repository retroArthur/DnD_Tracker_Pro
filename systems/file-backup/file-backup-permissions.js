// [SECTION:FILE_BACKUP_PERMISSIONS]
// IDB-Persistenz und Permission-Verwaltung fuer File System Access API
// Implementierung: Phase 2, Welle 2 (Plan 02-04)
//
// Hinweis: Dieser Code erwartet einen IDB-Store 'fileHandles'.
// Falls der bestehende IDB-Upgrade (core/init.js, IDB_VERSION) den Store
// noch nicht anlegt, muss er per defensivem createObjectStore ergaenzt werden:
//   if (!db.objectStoreNames.contains('fileHandles')) {
//       db.createObjectStore('fileHandles', { keyPath: 'id' });
//   }
// Ein IDB_VERSION-Bump gehoert zu Plan 02-01 / core/init.js, NICHT hierher.
// Die Funktionen hier arbeiten defensiv: Fehler beim IDB-Zugriff werden
// als null-Ergebnis zurueckgegeben (kein Toast-Gewitter).

const FILE_BACKUP_IDB_KEY = 'fileBackupDirHandle';

// ============================================================
// IDB-Handle-Persistenz
// ============================================================

/**
 * Speichert ein FileSystemDirectoryHandle in IndexedDB.
 * FileSystemHandle ist strukturiert-klonbar und kann direkt in IDB abgelegt werden.
 * @param {FileSystemDirectoryHandle} handle
 * @returns {Promise<void>}
 */
async function saveHandleToIDB(handle) {
    // initIndexedDB() liefert die DB-Instanz zurück (core/init.js setzt zusätzlich window.idb)
    const idb = await window.initIndexedDB();
    return new Promise((resolve, reject) => {
        // Defensiv: Falls 'fileHandles'-Store nicht existiert, wird ein Fehler gewurfen.
        // Das passiert, wenn IDB_VERSION noch nicht gebumpt wurde.
        const tx = idb.transaction(['fileHandles'], 'readwrite');
        tx.objectStore('fileHandles').put({ id: FILE_BACKUP_IDB_KEY, handle });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/**
 * Laedt das gespeicherte FileSystemDirectoryHandle aus IndexedDB.
 * @returns {Promise<FileSystemDirectoryHandle|null>}
 */
async function loadHandleFromIDB() {
    // initIndexedDB() liefert die DB-Instanz zurück (core/init.js setzt zusätzlich window.idb)
    let idb = null;
    try {
        idb = await window.initIndexedDB();
    } catch (e) {
        return null;
    }
    if (!idb) return null;
    return new Promise((resolve) => {
        try {
            const tx = idb.transaction(['fileHandles'], 'readonly');
            const req = tx.objectStore('fileHandles').get(FILE_BACKUP_IDB_KEY);
            req.onsuccess = () => resolve(req.result?.handle || null);
            req.onerror = () => resolve(null);
        } catch (e) {
            // Store existiert noch nicht (IDB_VERSION noch nicht gebumpt)
            resolve(null);
        }
    });
}

// ============================================================
// Permission-Handling (D-16: nur in User-Geste requestPermission aufrufen)
// ============================================================

/**
 * Stellt das gespeicherte Backup-Verzeichnis wieder her.
 * Laedt den IDB-Handle und prueft queryPermission.
 * WICHTIG: requestPermission wird hier NICHT aufgerufen — das muss
 * der Aufrufer in einer echten User-Geste (Klick-Handler) tun.
 * Anti-Pattern verhindert: Re-Prompt-Schleife (RESEARCH Pitfall 3).
 *
 * @returns {Promise<FileSystemDirectoryHandle|null>} Handle wenn 'granted', sonst null
 */
async function restoreBackupFolder() {
    const dirHandle = await loadHandleFromIDB();
    if (!dirHandle) return null;

    try {
        const permission = await dirHandle.queryPermission({ mode: 'readwrite' });
        if (permission === 'granted') return dirHandle;
        // Nicht 'granted' (z.B. 'prompt' oder 'denied'):
        // Aufrufer muss requestBackupFolderPermission() in einer User-Geste aufrufen.
        return null;
    } catch (e) {
        // API nicht unterstuetzt oder anderer Fehler
        if (window.APP_CONFIG?.DEBUG_MODE) {
            window.ErrorHandler?.log('restoreBackupFolder', e, 'queryPermission fehlgeschlagen');
        }
        return null;
    }
}

/**
 * Fordert Write-Permission fuer ein Verzeichnis-Handle an.
 * MUSS in einer echten User-Geste (z.B. Klick-Handler) aufgerufen werden —
 * requestPermission() wirft ausserhalb einer User-Geste einen SecurityError.
 *
 * @param {FileSystemDirectoryHandle} dirHandle
 * @returns {Promise<FileSystemDirectoryHandle|null>} Handle wenn 'granted', sonst null
 */
async function requestBackupFolderPermission(dirHandle) {
    if (!dirHandle) return null;
    try {
        const newPermission = await dirHandle.requestPermission({ mode: 'readwrite' });
        return newPermission === 'granted' ? dirHandle : null;
    } catch (e) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            window.ErrorHandler?.log('requestBackupFolderPermission', e, 'requestPermission fehlgeschlagen');
        }
        return null;
    }
}

// ============================================================
// Exports
// ============================================================
window.saveHandleToIDB = saveHandleToIDB;
window.loadHandleFromIDB = loadHandleFromIDB;
window.restoreBackupFolder = restoreBackupFolder;
window.requestBackupFolderPermission = requestBackupFolderPermission;
