// [SECTION:BACKUPS]
// ============================================================
// AUTO-BACKUP SYSTEM - @backup @restore @save @recovery
// ============================================================
// Constants from APP_CONFIG
const BACKUP_INTERVAL = window.APP_CONFIG?.BACKUP_INTERVAL || 300000; // 5 minutes
const MAX_BACKUPS = window.APP_CONFIG?.MAX_BACKUPS || 5;
const MAX_BACKUP_SIZE_MB = window.APP_CONFIG?.MAX_BACKUP_SIZE_MB || 2;
const BACKUP_KEY = window.APP_CONFIG?.BACKUP_KEY || 'dnd-tracker-backups';
// localStorage-Rueckfall (Code-Review 2026-09-21, R05/R10): EIN Schluessel fuer alle Kampagnen,
// und er teilt sich die ~5-MB-Quota der Origin mit dem Live-Save — dessen eigener
// IndexedDB-Rueckfall faellt genau dann auch aus, wenn dieser Pfad laeuft. Deshalb hoechstens
// zwei Eintraege der schreibenden Kampagne und ein Budget fuer die ganze Liste.
const MAX_LS_BACKUPS_PER_CAMPAIGN = 2;
const LS_BACKUP_BUDGET_CHARS = MAX_BACKUP_SIZE_MB * 2 * 1024 * 1024;
// Frist fuer das Wiederbeleben der Audio-Blobs (Code-Review 2026-09-21, Korrekturrunde F4).
// initIndexedDB() hat keinen onblocked-Handler, und restoreSoundBlob() oeffnet je Blob eine
// Verbindung: ein ausstehendes Versions-Upgrade eines anderen Tabs laesst jeden open() ewig
// warten. Ohne Frist blieb der Restore genau dort stehen — D schon ersetzt, nichts gerendert,
// nichts gespeichert, keine Meldung. Nicht ueber die Kulanzzeit hinaus erhoehen: die Frist ist
// die Obergrenze, die der Nutzer auf eine geschlossene Modalflaeche wartet.
const REVIVE_TIMEOUT_MS = 5000;

// Track if we already warned about backup failures (avoid console spam)
let _backupFailureLogged = false;

/**
 * Sind die Schreibpfade dieser Kampagne gesperrt (retireCampaignWrites)? Laeuft
 * deleteCampaign() oder clearStorage(), darf kein Auto-Backup-Tick die Kampagne erneut
 * sichern — fuer den Standard-Schluessel tauchte so eine Zeile nach dem Neuladen in der neuen,
 * leeren Kampagne wieder auf und widersprach dem Bestaetigungstext (D2 = A).
 *
 * WICHTIG (Korrekturrunde F4): an JEDER Stelle pruefen, an der wirklich geschrieben wird,
 * nicht nur einmal am Anfang von createAutoBackup(). Zwischen der ersten Pruefung und dem
 * Schreiben liegen awaits — der IndexedDB-Versuch selbst und, solange window.idb noch nicht
 * offen ist, initIndexedDB() darin. In diesen awaits laeuft das Sperren, Entfernen und
 * Aufraeumen vollstaendig durch; danach schrieb derselbe Tick die Zeile der geloeschten
 * Kampagne neu und meldete dafuer 'written' (T17d/T17e).
 *
 * Es geht dabei nichts verloren: die Sicherheitskopie von clearStorage() ist bestaetigt
 * geschrieben, BEVOR gesperrt wird, und die Importpfade sperren erst nach ihrer Kopie.
 * @returns {boolean}
 */
function backupWritesRetired() {
    return (
        typeof window.areCampaignWritesRetired === 'function' &&
        window.areCampaignWritesRetired() === true
    );
}

/**
 * Auto-Backup der AKTIVEN Kampagne; primaer IndexedDB, localStorage als Rueckfall
 * (Code-Review 2026-09-21, R10/R05).
 *
 * VERTRAG: alles bis einschliesslich JSON.stringify(D) laeuft SYNCHRON beim Aufruf, vor dem
 * ersten await. Die Sicherheitskopie-Aufrufer in import-export.js verlassen sich darauf: sie
 * rufen ohne await auf und aendern D direkt danach. Kein await davor einfuegen.
 *
 * - Nie unter einem ungueltigen Schluessel schreiben oder aufraeumen:
 *   IDBIndex.getAll(undefined) traefe die Backups ALLER Kampagnen.
 * - Inhaltsregel ist die gemeinsame, SEC-06-gepruefte Definition hasCampaignContent()
 *   (migration-wizard.js). Sie wird zur Aufrufzeit gebunden, weil migration-wizard.js nach
 *   backups.js laedt; fehlt sie, wird gesichert (fail-open). NICHT _hatKampagnenInhalt() aus
 *   file-backup: die zaehlt diceHistory und partyGold — eine geleerte Kampagne plus ein
 *   Probewurf wuerde alle 5 Minuten gesichert und verdraengte die Sicherheitskopie von vor
 *   dem Leeren.
 * @param {{reason?: string}} [options] - reason 'safety': Sicherheitskopie vor einer
 *   destruktiven Aktion; sie ist gegen die periodische Rotation geschuetzt
 * @returns {Promise<'written'|'unchanged'|'skipped-empty'|'failed'>}
 */
async function createAutoBackup(options = {}) {
    try {
        const key =
            typeof window.getActiveCampaignKey === 'function'
                ? window.getActiveCampaignKey()
                : null;
        if (!key) return 'failed';
        // Schreibsperre respektieren (Korrekturrunde F4, D2) — erste von drei Pruefungen:
        // hier gar nicht erst anfangen. Die beiden anderen stehen unmittelbar vor den echten
        // Schreibvorgaengen (saveBackupToIndexedDB, writeLocalBackup), weil dazwischen awaits
        // liegen. Siehe backupWritesRetired().
        if (backupWritesRetired()) return 'failed';
        const D = window.D;
        if (typeof window.hasCampaignContent === 'function' && !window.hasCampaignContent(D)) {
            return 'skipped-empty';
        }
        const backup = {
            timestamp: Date.now(),
            campaignKey: key,
            data: JSON.stringify(D),
            kind: options && options.reason === 'safety' ? 'safety' : 'auto'
        };
        // Versuche IndexedDB (bevorzugt, kein Quota-Limit)
        try {
            return await saveBackupToIndexedDB(backup);
        } catch (idbError) {
            if (window.APP_CONFIG?.DEBUG_MODE) {
                window.ErrorHandler?.log(
                    'createAutoBackup',
                    idbError,
                    'IndexedDB failed, trying localStorage'
                );
            }
        }
        return writeLocalBackup(backup);
    } catch (e) {
        if (window.APP_CONFIG?.DEBUG_MODE && !_backupFailureLogged) {
            window.ErrorHandler?.log(
                'createAutoBackup',
                e,
                'Auto-backup failed (weitere Fehler werden unterdrückt)'
            );
            _backupFailureLogged = true;
        }
        return 'failed';
    }
}
/**
 * IndexedDB-Backup. R04: loest erst nach dem bestaetigten Commit auf; ein abgebrochener
 * Commit lehnt ab, damit createAutoBackup() den localStorage-Rueckfall erreicht.
 * R10: verglichen wird nur mit der NEUESTEN Zeile der Kampagne — nach einem Undo auf einen
 * aelteren Stand muss dieser erneut geschrieben werden, sonst laege er nur noch in der
 * aeltesten Zeile, die als erste herausrotiert. Beim Rotieren bleibt die neueste
 * Sicherheitskopie ('safety') stehen; Zeilen ohne kind zaehlen als 'auto'.
 * @param {{timestamp: number, campaignKey: string, data: string, kind?: string}} backup
 * @returns {Promise<'written'|'unchanged'|'failed'>}
 */
async function saveBackupToIndexedDB(backup) {
    if (!backup || typeof backup.campaignKey !== 'string' || backup.campaignKey === '') {
        throw new Error('Kein Kampagnenschlüssel');
    }
    const outcome = await window.idbWriteTx(['backups'], transaction => {
        const result = { status: 'written' };
        // Zweite Sperrpruefung (Korrekturrunde F4, T17e): DIESER Durchlauf laeuft im selben
        // Task, in dem die Transaktion entsteht — es ist der letzte Punkt, an dem eine
        // Reihenfolge gegenueber der Aufraeum-Transaktion noch feststeht. Davor liegt
        // initIndexedDB() hinter einem await (utils/idb-tx.js), in dem deleteCampaign() bzw.
        // clearStorage() vollstaendig durchlaufen kann. Dann wird nichts eingereiht und die
        // Transaktion committet leer.
        if (backupWritesRetired()) {
            result.status = 'retired';
            return result;
        }
        const store = transaction.objectStore('backups');
        const request = store.index('campaign').getAll(backup.campaignKey);
        request.onsuccess = () => {
            const existing = Array.isArray(request.result) ? request.result.slice() : [];
            existing.sort((a, b) => b.timestamp - a.timestamp);
            const newest = existing[0];
            if (newest && newest.data === backup.data) {
                result.status = 'unchanged';
                if (backup.kind === 'safety' && newest.kind !== 'safety') {
                    newest.kind = 'safety';
                    store.put(newest);
                }
                return;
            }
            const protectedRow =
                backup.kind === 'safety' ? null : existing.find(b => b.kind === 'safety') || null;
            // Aelteste nicht geschuetzte Zeilen loeschen, bis Platz fuer die neue ist
            let remaining = existing.length;
            for (let i = existing.length - 1; i >= 0 && remaining > MAX_BACKUPS - 1; i--) {
                if (existing[i] === protectedRow) continue;
                store.delete(existing[i].id);
                remaining--;
            }
            backup.id = `${backup.campaignKey}-${backup.timestamp}`;
            store.put(backup);
        };
        return result;
    });
    return outcome.status === 'retired' ? 'failed' : outcome.status;
}
/**
 * Schluessel aller bekannten Kampagnen (Standard + Kampagnenindex). null, wenn der Index
 * nicht lesbar ist — dann gilt kein Eintrag als verwaist.
 * @returns {Set<string>|null}
 */
function knownBackupCampaignKeys() {
    if (typeof window.getCampaignIndex !== 'function') return null;
    try {
        const index = window.getCampaignIndex();
        const keys = new Set([window.APP_CONFIG?.STORAGE_KEY]);
        (index && Array.isArray(index.campaigns) ? index.campaigns : []).forEach(c => {
            if (c && typeof c.key === 'string') keys.add(c.key);
        });
        return keys;
    } catch {
        return null;
    }
}
/**
 * Naechster Verdraengungskandidat der localStorage-Liste (Index) oder -1. Reihenfolge:
 * (1) verwaiste Eintraege (Kampagne weder Standard noch im Index), aelteste zuerst;
 * (2) nicht-neueste Eintraege anderer Kampagnen, aelteste zuerst;
 * (3) aeltere Eintraege der schreibenden Kampagne;
 * (4) neueste Eintraege anderer Kampagnen, aelteste zuerst.
 * Das neue Backup weicht nie.
 * @param {Array<Object>} list
 * @param {Object} backup - das neue Backup (Objektidentitaet)
 * @param {Set<string>|null} known - knownBackupCampaignKeys()
 * @returns {number}
 */
function pickLocalBackupEviction(list, backup, known) {
    const newestOf = new Map();
    for (const b of list) {
        const cur = newestOf.get(b.campaignKey);
        if (!cur || b.timestamp > cur.timestamp) newestOf.set(b.campaignKey, b);
    }
    const foreign = b => b.campaignKey !== backup.campaignKey;
    const stufen = [
        b => foreign(b) && known !== null && !known.has(b.campaignKey),
        b => foreign(b) && newestOf.get(b.campaignKey) !== b,
        b => !foreign(b),
        b => foreign(b)
    ];
    for (const passt of stufen) {
        let best = -1;
        list.forEach((b, i) => {
            if (b === backup || !passt(b)) return;
            if (best === -1 || b.timestamp < list[best].timestamp) best = i;
        });
        if (best !== -1) return best;
    }
    return -1;
}
/**
 * Deckelt NUR die schreibende Kampagne auf MAX_LS_BACKUPS_PER_CAMPAIGN Eintraege: das neue
 * Backup, bevorzugt ihre neueste Sicherheitskopie, dann die neuesten uebrigen.
 * @param {Array<Object>} list - enthaelt backup
 * @param {Object} backup
 * @returns {Array<Object>}
 */
function capOwnLocalBackups(list, backup) {
    const own = list
        .filter(b => b !== backup && isBackupOfCampaign(b, backup.campaignKey))
        .sort((a, b) => b.timestamp - a.timestamp);
    const keep = new Set([backup]);
    if (backup.kind !== 'safety') {
        const safety = own.find(b => b.kind === 'safety');
        if (safety) keep.add(safety);
    }
    for (const b of own) {
        if (keep.size >= MAX_LS_BACKUPS_PER_CAMPAIGN) break;
        keep.add(b);
    }
    return list.filter(b => !isBackupOfCampaign(b, backup.campaignKey) || keep.has(b));
}
/**
 * localStorage-Rueckfall fuer EIN Backup (Code-Review 2026-09-21, R05/R10). Fremde Eintraege
 * weichen nur bei Budgetueberschreitung oder Quota-Fehler (pickLocalBackupEviction), die Liste
 * wird nie als Ganzes geloescht (frueher entfernte der Quota-Zweig den ganzen Schluessel und
 * damit die Backups ALLER Kampagnen). Scheitert auch der letzte Versuch, bleibt die
 * gespeicherte Liste unveraendert.
 *
 * Dritte Sperrpruefung (Korrekturrunde F4, T17d): dieser Pfad wird erst NACH dem
 * gescheiterten IndexedDB-Versuch erreicht, also hinter einem await. Genau dafuer existiert
 * er — fuer abgebrochene oder quota-bedingt scheiternde Commits — und genau so ein Commit
 * kann in die mehreren IDB-Umlaeufe von removeCampaignData() + purgeCampaignBackups()
 * fallen. Ohne die Pruefung kehrte die Zeile der geloeschten Kampagne hier zurueck.
 * @param {Object} backup
 * @returns {'written'|'unchanged'|'failed'}
 */
function writeLocalBackup(backup) {
    if (backupWritesRetired()) return 'failed';
    const backupSizeMB = new Blob([backup.data]).size / (1024 * 1024);
    if (backupSizeMB > MAX_BACKUP_SIZE_MB) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            window.ErrorHandler?.log(
                'createAutoBackup',
                new Error('Backup too large for localStorage'),
                `${backupSizeMB.toFixed(1)}MB exceeds limit`
            );
        }
        return 'failed';
    }
    const list = readLocalBackups();
    // Dublette nur gegen den NEUESTEN Eintrag derselben Kampagne pruefen
    const newestOwn = list
        .filter(b => isBackupOfCampaign(b, backup.campaignKey))
        .reduce((a, b) => (!a || b.timestamp > a.timestamp ? b : a), null);
    if (newestOwn && newestOwn.data === backup.data) {
        if (backup.kind === 'safety' && newestOwn.kind !== 'safety') {
            newestOwn.kind = 'safety';
            StorageAPI.setQuiet(BACKUP_KEY, JSON.stringify(list));
        }
        return 'unchanged';
    }
    const next = capOwnLocalBackups([backup, ...list], backup);
    const known = knownBackupCampaignKeys();
    const sizes = new Map(next.map(b => [b, JSON.stringify(b).length]));
    // Laenge von JSON.stringify(list), ohne die (grossen) Daten erneut zu serialisieren
    const totalChars = l => l.reduce((sum, b) => sum + sizes.get(b), 0) + l.length + 1;
    while (totalChars(next) > LS_BACKUP_BUDGET_CHARS) {
        const i = pickLocalBackupEviction(next, backup, known);
        if (i === -1) break;
        next.splice(i, 1);
    }
    let result = StorageAPI.setQuiet(BACKUP_KEY, JSON.stringify(next));
    while (!result.success && result.error === 'QUOTA_EXCEEDED') {
        const i = pickLocalBackupEviction(next, backup, known);
        if (i === -1) break;
        next.splice(i, 1);
        result = StorageAPI.setQuiet(BACKUP_KEY, JSON.stringify(next));
    }
    return result.success ? 'written' : 'failed';
}
/**
 * Meldet das ECHTE Ergebnis einer Sicherheitskopie (Code-Review 2026-09-21, R10) — frueher
 * stand "Sicherheitskopie erstellt" unbedingt da, auch wenn nichts geschrieben wurde. Wartet
 * auf den Status und wirft nie; ein abgelehntes Promise gilt als 'failed'.
 * @param {Promise<string>|string} statusOrPromise - Ergebnis von createAutoBackup()
 * @returns {Promise<string>} der Status
 */
async function reportSafetyBackup(statusOrPromise) {
    let status;
    try {
        status = await statusOrPromise;
    } catch (e) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            window.ErrorHandler?.log('reportSafetyBackup', e, 'Sicherheitskopie abgelehnt');
        }
        status = 'failed';
    }
    try {
        if (status === 'written') {
            showToast('💾 Sicherheitskopie erstellt', 'info', 1500);
        } else if (status === 'unchanged') {
            showToast('💾 Sicherheitskopie vorhanden', 'info', 1500);
        } else if (status !== 'skipped-empty') {
            status = 'failed';
            showToast('⚠️ Sicherheitskopie fehlgeschlagen', 'warning');
        }
    } catch (e) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            window.ErrorHandler?.log('reportSafetyBackup', e, 'Meldung fehlgeschlagen');
        }
    }
    return status;
}
/**
 * Entfernt ALLE Auto-Backups einer Kampagne aus beiden Quellen (Nutzerentscheidung D2 = A:
 * das Loeschen einer Kampagne loescht auch ihre Auto-Backups). Nie ohne gueltigen Schluessel —
 * index.getAll(undefined) liefe ueber ALLE Kampagnen. Fremde Eintraege der localStorage-Liste
 * bleiben unveraendert. Wirft nie.
 * @param {string} key - Kampagnen-Speicherschluessel
 * @returns {Promise<{success: boolean, error?: *}>}
 */
async function purgeCampaignBackups(key) {
    if (typeof key !== 'string' || key === '') {
        return { success: false, error: new Error('Kein Kampagnenschlüssel') };
    }
    let error = null;
    try {
        await window.idbWriteTx(['backups'], transaction => {
            const store = transaction.objectStore('backups');
            const request = store.index('campaign').getAll(key);
            request.onsuccess = () => {
                (Array.isArray(request.result) ? request.result : []).forEach(row => {
                    if (isBackupOfCampaign(row, key)) store.delete(row.id);
                });
            };
        });
    } catch (e) {
        error = e;
    }
    try {
        const raw = StorageAPI.getJSON(BACKUP_KEY, null);
        if (Array.isArray(raw)) {
            const rest = raw.filter(b => !isBackupOfCampaign(b, key));
            if (rest.length !== raw.length) {
                const r = StorageAPI.setQuiet(BACKUP_KEY, JSON.stringify(rest));
                if (!r.success && !error) error = r.original || new Error(r.error);
            }
        }
    } catch (e) {
        if (!error) error = e;
    }
    return error ? { success: false, error } : { success: true };
}
// ============================================================
// BACKUP-LISTE & WIEDERHERSTELLUNG (Code-Review 2026-09-21, R01/R05)
// Nur Backups der AKTIVEN Kampagne werden angeboten und wiederhergestellt. Beide Quellen
// (gemeinsamer localStorage-Schluessel aller Kampagnen, IndexedDB-Store) werden VOR dem
// Zusammenfuehren formgeprueft und gefiltert; Alt-Backups ohne campaignKey werden nicht
// angeboten (Nutzerentscheidung D1). Stabile Backup-ID ist der Zeitstempel, nie eine
// Listenposition (die driftet, sobald ein neues Auto-Backup dazukommt).
// ============================================================
/**
 * Gehoert ein Backup zur Kampagne key? Nur ein nicht-leerer, exakt gleicher
 * campaignKey zaehlt.
 * @param {any} b - Backup-Datensatz
 * @param {string} key - Kampagnen-Speicherschluessel
 * @returns {boolean}
 */
function isBackupOfCampaign(b, key) {
    return (
        !!b && typeof b.campaignKey === 'string' && b.campaignKey !== '' && b.campaignKey === key
    );
}
/**
 * Formpruefung fuer Backup-Datensaetze aus BEIDEN Quellen. Der Zeitstempel landet als
 * stabile ID im data-id-Attribut des Modals und muss deshalb eine sichere positive
 * Ganzzahl sein (ein String-Zeitstempel aus IndexedDB darf dort nie ankommen).
 * @param {any} b - Backup-Datensatz
 * @returns {boolean}
 */
function isValidBackupRecord(b) {
    return (
        isPlainDataObject(b) &&
        Number.isSafeInteger(b.timestamp) &&
        b.timestamp > 0 &&
        typeof b.data === 'string' &&
        typeof b.campaignKey === 'string'
    );
}
/**
 * Formgepruefte localStorage-Backup-Liste (ein Schluessel fuer ALLE Kampagnen —
 * Aufrufer filtern selbst nach Kampagne).
 * @returns {Array<Object>}
 */
function readLocalBackups() {
    const list = StorageAPI.getJSON(BACKUP_KEY, []);
    return Array.isArray(list) ? list.filter(isValidBackupRecord) : [];
}
/**
 * IndexedDB-Backups einer Kampagne ueber den 'campaign'-Index (nur lesend). Lehnt bei
 * jedem Fehler ab. key MUSS ein gueltiger Schluessel sein: index.getAll(undefined)
 * liefert ALLE Datensaetze.
 * @param {string} key - Kampagnen-Speicherschluessel
 * @returns {Promise<Array<Object>>}
 */
async function readIndexedDbBackups(key) {
    if (typeof key !== 'string' || key === '') throw new Error('Kein Kampagnenschlüssel');
    if (!window.idb) {
        if (typeof window.initIndexedDB !== 'function') {
            throw new Error('IndexedDB nicht verfügbar');
        }
        await window.initIndexedDB();
    }
    const idb = window.idb;
    if (!idb) throw new Error('IndexedDB nicht verfügbar');
    return new Promise((resolve, reject) => {
        const transaction = idb.transaction(['backups'], 'readonly');
        const request = transaction.objectStore('backups').index('campaign').getAll(key);
        request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
        request.onerror = () => reject(request.error || new Error('IndexedDB-Lesefehler'));
    });
}
/**
 * Nach Zeitstempel entdoppeln (erster Treffer gewinnt), neueste zuerst, auf MAX_BACKUPS
 * begrenzen. Erst NACH dem Filtern aufrufen — sonst verdraengen fremde Backups eigene.
 * @param {Array<Object>} list
 * @returns {Array<Object>}
 */
function sortAndLimitBackups(list) {
    const seen = new Set();
    const unique = [];
    for (const b of list) {
        if (seen.has(b.timestamp)) continue;
        seen.add(b.timestamp);
        unique.push(b);
    }
    unique.sort((a, b) => b.timestamp - a.timestamp);
    return unique.slice(0, MAX_BACKUPS);
}
/**
 * Backups der aktiven Kampagne aus beiden Quellen. Faellt IndexedDB aus, bleibt es bei
 * der gefilterten localStorage-Liste (derselbe Filter, dieselbe Begrenzung).
 *
 * Die neueste Sicherheitskopie ist in BEIDEN Quellen gegen die Rotation geschuetzt und muss
 * deshalb auch sichtbar bleiben (Code-Review 2026-09-21, Korrekturrunde F4): schon ein
 * abgebrochener IndexedDB-Commit legt localStorage-Eintraege an, die die (aelteste)
 * Sicherheitskopie dauerhaft aus der auf MAX_BACKUPS gekuerzten Liste schoben — die Zeile
 * existierte weiter, restoreBackup() meldete aber "Backup nicht gefunden".
 * @returns {Promise<Array<Object>>}
 */
async function getBackups() {
    const key =
        typeof window.getActiveCampaignKey === 'function' ? window.getActiveCampaignKey() : null;
    if (!key) return [];
    const own = readLocalBackups().filter(b => isBackupOfCampaign(b, key));
    let fromIdb = [];
    try {
        fromIdb = (await readIndexedDbBackups(key)).filter(
            b => isValidBackupRecord(b) && isBackupOfCampaign(b, key)
        );
    } catch (e) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            window.ErrorHandler?.log('getBackups', e, 'IndexedDB-Backups nicht lesbar');
        }
    }
    const all = [...own, ...fromIdb];
    const list = sortAndLimitBackups(all);
    const safety = all
        .filter(b => b.kind === 'safety')
        .reduce((neueste, b) => (!neueste || b.timestamp > neueste.timestamp ? b : neueste), null);
    if (safety && !list.some(b => b.timestamp === safety.timestamp)) {
        // Sie ist aelter als jede sichtbare Zeile (sonst waere sie gelistet), steht also
        // sortiert am Ende; die Liste bleibt hoechstens MAX_BACKUPS lang.
        list.splice(Math.min(list.length, MAX_BACKUPS - 1), MAX_BACKUPS, safety);
    }
    return list;
}
/**
 * Loest eine Backup-ID (Zeitstempel aus data-id) gegen eine Backup-Liste auf. Rein.
 * 'foreign' ist Verteidigung in der Tiefe: getBackups() liefert nur eigene Backups.
 * @param {Array<Object>} backups
 * @param {number|string} backupId - Zeitstempel
 * @param {string} key - aktiver Kampagnenschluessel
 * @returns {{status: 'ok'|'missing'|'foreign', backup: Object|null}}
 */
function findBackupForRestore(backups, backupId, key) {
    const ts = parseEntityId(backupId);
    if (!Number.isSafeInteger(ts)) return { status: 'missing', backup: null };
    const backup = (Array.isArray(backups) ? backups : []).find(b => b && b.timestamp === ts);
    if (!backup) return { status: 'missing', backup: null };
    return isBackupOfCampaign(backup, key)
        ? { status: 'ok', backup }
        : { status: 'foreign', backup };
}
/**
 * Holt die Audio-Blobs zurueck, auf die die Soundboard-Szenen von data verweisen.
 * Grund: removeAudioFile() setzt nur einen Grabstein, und _cleanupStaleTombstones()
 * loescht Grabsteine frueherer Sitzungen beim naechsten Start endgueltig — eine
 * wiederhergestellte Szene spielte jetzt und verloere ihr Audio still in der naechsten
 * Sitzung. restoreSoundBlob() ist idempotent; false heisst "schon endgueltig weg".
 *
 * Kommt binnen REVIVE_TIMEOUT_MS zurueck, auch wenn ein restoreSoundBlob() nie siedelt
 * (Code-Review 2026-09-21, Korrekturrunde F4). Was bis dahin nicht durch ist, zaehlt als
 * 'failed' — genau wie eine Ablehnung, die frueher nur geloggt wurde: der Grabstein bleibt
 * dann stehen und der naechste Start loescht die Datei endgueltig, also muss der Nutzer es
 * erfahren. 'missing' ist der andere Fall: die Datei ist schon endgueltig weg.
 * @param {Object} data - Kampagnenobjekt
 * @returns {Promise<{missing: number, failed: number}>} endgueltig fehlende bzw. nicht
 *   wiederbelebte Dateien
 */
async function reviveReferencedSoundBlobs(data) {
    const scenes = Array.isArray(data?.soundboard?.scenes) ? data.soundboard.scenes : [];
    const ids = new Set();
    for (const scene of scenes) {
        if (!scene || !Array.isArray(scene.tracks)) continue;
        for (const track of scene.tracks) {
            if (track && typeof track.blobId === 'string' && track.blobId !== '') {
                ids.add(track.blobId);
            }
        }
    }
    if (ids.size === 0 || typeof window.restoreSoundBlob !== 'function') {
        return { missing: 0, failed: 0 };
    }
    let missing = 0;
    let failed = 0;
    let settled = 0;
    const worker = (async () => {
        for (const id of ids) {
            try {
                const found = await window.restoreSoundBlob(id);
                if (found === false) missing++;
            } catch (e) {
                failed++;
                if (window.APP_CONFIG?.DEBUG_MODE) {
                    window.ErrorHandler?.log('reviveReferencedSoundBlobs', e, id);
                }
            }
            settled++;
        }
    })();
    let frist = null;
    await Promise.race([
        worker,
        new Promise(resolve => {
            frist = window.setTimeout(resolve, REVIVE_TIMEOUT_MS);
        })
    ]);
    if (frist !== null) window.clearTimeout(frist);
    // Schnappschuss NACH dem Rennen: was noch laeuft, gilt als nicht wiederbelebt
    return { missing, failed: failed + (ids.size - settled) };
}
/**
 * Gemeinsamer Schluss von restoreBackup() und restoreFromFileBackup(): uebernimmt eine
 * NORMALISIERTE Kampagne (normalizeCampaignData(...).data) als aktuellen Stand.
 * Reihenfolge: Undo-Punkt -> Audio stoppen -> D ersetzen -> Integritaet -> rendern ->
 * Audio-Blobs wiederbeleben -> speichern. Ein Fehler NACH dem Ersetzen (z. B. beim Rendern)
 * wird nur geloggt — der Stand ist gueltig und muss gespeichert werden. Erfolg wird nur
 * nach bestaetigtem Speichern gemeldet; saveImmediate() meldet Fehler selbst laut.
 *
 * Gerendert wird VOR dem Wiederbeleben (Code-Review 2026-09-21, Korrekturrunde F4): das
 * Wiederbeleben haengt an fremden IndexedDB-Verbindungen, und solange es das Zeichnen
 * aufhielt, stand ein bereits ersetztes D hinter einer veralteten, bedienbaren Oberflaeche.
 * Das Wiederbeleben bleibt aber VOR dem Speichern — sonst raeumt der naechste Start die
 * Grabsteine ab, bevor sie zurueckgenommen sind (von R6a gepinnt).
 * @param {Object} data - normalisierte Kampagne
 * @param {string} source - Aufrufer (fuer das Fehlerlog)
 * @returns {Promise<boolean>} true, wenn das Speichern bestaetigt wurde
 */
async function applyRestoredCampaign(data, source) {
    if (typeof window.saveUndoState === 'function') {
        window.saveUndoState('Backup wiederhergestellt');
    }
    // Soundboard-Audio stoppen — Web Audio überlebt sonst den Daten-Reset
    if (typeof window.stopAllTracks === 'function') window.stopAllTracks();
    window.replaceCampaignData(window.D, data);
    try {
        // Paritaet mit load(): Selbstheilung nach dem Uebernehmen
        if (typeof window.validateDataIntegrity === 'function') window.validateDataIntegrity();
    } catch (e) {
        window.ErrorHandler?.log(source, e, 'Integritätsprüfung nach Wiederherstellung');
    }
    try {
        // U8-Nachlauf fuer einen ganz ersetzten D: Theme, Layout, aktive Ansicht und
        // Schnellnotizen. renderAll() allein liess Theme/Layout bis zum naechsten Start stehen.
        const zeichnen = window.renderAfterDataReplace || window.renderAll;
        if (typeof zeichnen === 'function') zeichnen();
        const quickNotes = $('quick-notes');
        if (quickNotes) quickNotes.value = window.D.quickNotes || '';
    } catch (e) {
        window.ErrorHandler?.log(source, e, 'Rendern nach Wiederherstellung fehlgeschlagen');
    }
    const { missing, failed } = await reviveReferencedSoundBlobs(window.D);
    if (missing > 0) {
        showToast(
            `⚠️ ${missing} Audiodatei(en) aus diesem Backup sind nicht mehr vorhanden`,
            'warning'
        );
    }
    if (failed > 0) {
        showToast(`⚠️ ${failed} Audiodatei(en) konnten nicht wiederhergestellt werden`, 'warning');
    }
    let res = null;
    try {
        res = typeof window.saveImmediate === 'function' ? await window.saveImmediate() : null;
    } catch (e) {
        window.ErrorHandler?.log(source, e, 'Speichern nach Wiederherstellung fehlgeschlagen');
    }
    if (res && res.success) {
        showToast('✅ Backup wiederhergestellt');
        return true;
    }
    return false;
}
/**
 * Stellt ein Auto-Backup der aktiven Kampagne wieder her.
 * Invariante: window.D, Undo-Stapel und Speicher bleiben unberuehrt, bis das Backup
 * vollstaendig geprueft und normalisiert ist. Kein Sicherungs-Backup vorab: dessen
 * Rotation verdraengte gerade die noch nicht probierten Backups — Strg+Z ist das Netz.
 * @param {number|string} backupId - Zeitstempel des Backups (data-id im Modal)
 */
async function restoreBackup(backupId) {
    const key =
        typeof window.getActiveCampaignKey === 'function' ? window.getActiveCampaignKey() : null;
    if (!key) {
        showToast('❌ Keine aktive Kampagne', 'error');
        return;
    }
    const { status, backup } = findBackupForRestore(await getBackups(), backupId, key);
    if (status === 'foreign') {
        showToast(
            '❌ Dieses Backup gehört nicht zur aktiven Kampagne — Wiederherstellung abgebrochen.',
            'error'
        );
        return;
    }
    if (status !== 'ok') {
        showToast('❌ Backup nicht gefunden', 'error');
        return;
    }
    const label =
        typeof window.getCampaignDisplayName === 'function'
            ? window.getCampaignDisplayName(key)
            : key;
    // confirm() zeigt Klartext — esc() würde sichtbare Entities erzeugen (WR-05)
    const when = new Date(backup.timestamp).toLocaleString('de-DE');
    if (
        !confirm(
            `Kampagne „${label}“ auf das Backup vom ${when} zurücksetzen?\n\nDer aktuelle Stand wird überschrieben. Dieser Vorgang kann mit Strg+Z rückgängig gemacht werden.`
        )
    ) {
        return;
    }
    const result = window.normalizeCampaignData(backup.data);
    if (!result.ok) {
        window.ErrorHandler?.log('restoreBackup', new Error(result.error), 'Backup restore failed');
        showToast('❌ Backup fehlerhaft: ' + result.error, 'error');
        return;
    }
    await applyRestoredCampaign(result.data, 'restoreBackup');
}
async function showBackupsModal() {
    const key =
        typeof window.getActiveCampaignKey === 'function' ? window.getActiveCampaignKey() : null;
    const label =
        key && typeof window.getCampaignDisplayName === 'function'
            ? window.getCampaignDisplayName(key)
            : key || '';
    const backups = await getBackups();
    const renderEmptyState = window.renderEmptyState;
    const showModal = window.showModal;
    // Welche Kampagne diese Liste zeigt (auch im leeren Zustand)
    let content = `<div class="meta-text">Kampagne: ${esc(label)}</div>`;
    if (backups.length === 0) {
        content += renderEmptyState({
            icon: '💾',
            titleEmpty: 'Keine Backups',
            descEmpty: 'Backups werden automatisch alle 5 Minuten erstellt.',
            gridSpan: 'auto'
        });
    } else {
        // data-id = Zeitstempel: von isValidBackupRecord() als sichere Ganzzahl geprueft
        content += backups
            .map((b, i) => {
                const date = new Date(b.timestamp);
                const timeStr = date.toLocaleString('de-DE');
                const sizeMB = b.data ? (new Blob([b.data]).size / (1024 * 1024)).toFixed(1) : '?';
                return `<div class="backup-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg-dark); border-radius: 6px; margin-bottom: 8px;">
                <div>
                    <div style="font-weight: 500;">${timeStr}</div>
                    <div style="font-size: 0.85em; color: var(--text-dim);">Backup #${i + 1} (${sizeMB} MB)</div>
                </div>
                <button class="btn btn-sm" data-action="restore-backup" data-id="${b.timestamp}">Wiederherstellen</button>
            </div>`;
            })
            .join('');
    }
    // Dynamisches Modal erstellen
    let modal = $('backups-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'backups-modal';
        modal.innerHTML = `
            <div class="modal" style="max-width: 450px;">
                <div class="modal-header">
                    <span class="modal-title">💾 Auto-Backups</span>
                    <button class="btn btn-sm" data-action="hide-modal" data-value="backups-modal">✕</button>
                </div>
                <div id="backups-list"></div>
                <div style="margin-top: 12px; font-size: 0.85em; color: var(--text-dim);">
                    Backups werden alle 5 Minuten erstellt (max. ${MAX_BACKUPS}).
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    const list = $('backups-list');
    if (list) list.innerHTML = content;
    if (showModal) showModal('backups-modal');
}
// Auto-Backup Interval starten
let backupInterval = null;
function startAutoBackup() {
    if (backupInterval) clearInterval(backupInterval);
    backupInterval = window.setInterval(createAutoBackup, BACKUP_INTERVAL);
    // Erstes Backup nach 1 Minute
    setTimeout(createAutoBackup, 60000);
}
// ============================================================
// PERFORMANCE MONITORING SYSTEM
// ============================================================
const performanceMetrics = {
    renderTimes: [],
    saveTimes: [],
    entityCounts: {},
    lastCheck: Date.now()
};
let perfMonitoringInterval = null;
function initPerformanceMonitoring() {
    // Überwache Entity-Größen
    updateEntityCounts();
    // Performance-Check alle 30 Sekunden
    if (perfMonitoringInterval) clearInterval(perfMonitoringInterval);
    perfMonitoringInterval = window.setInterval(() => {
        checkPerformance();
    }, 30000);
    // Initial Check
    checkPerformance();
}
function updateEntityCounts() {
    const D = window.D;
    performanceMetrics.entityCounts = {
        characters: D.characters?.length || 0,
        npcs: D.npcs?.length || 0,
        quests: D.quests?.length || 0,
        locations: D.locations?.length || 0,
        encounters: D.encounters?.length || 0,
        loot: D.loot?.length || 0,
        notes: D.notes?.length || 0
    };
}
function trackRenderTime(functionName, startTime) {
    const duration = performance.now() - startTime;
    performanceMetrics.renderTimes.push({
        function: functionName,
        duration,
        timestamp: Date.now()
    });
    // Behalte nur letzte 50 Messungen
    if (performanceMetrics.renderTimes.length > 50) {
        performanceMetrics.renderTimes = performanceMetrics.renderTimes.slice(-50);
    }
    const APP_CONFIG = window.APP_CONFIG;
    const ErrorHandler = window.ErrorHandler;
    // Warnung bei langsamen Renders (>500ms)
    if (duration > 500 && APP_CONFIG.DEBUG_MODE) {
        ErrorHandler.log(
            'trackRenderTime',
            new Error('Slow render detected'),
            `${functionName} took ${duration.toFixed(0)}ms`
        );
    }
}
function checkPerformance() {
    updateEntityCounts();
    const totalEntities = Object.values(performanceMetrics.entityCounts).reduce((a, b) => a + b, 0);
    const APP_CONFIG = window.APP_CONFIG;
    const ErrorHandler = window.ErrorHandler;
    // Warnung bei vielen Entities (>500 gesamt)
    if (totalEntities > 500 && APP_CONFIG.DEBUG_MODE) {
        ErrorHandler.log(
            'checkPerformance',
            new Error('Large campaign detected'),
            `${totalEntities} total entities`
        );
        // Empfehlung für Virtual Scrolling
        if (totalEntities > 1000 && !window.performanceWarningShown) {
            showToast(
                '⚠️ Große Kampagne erkannt. Performance könnte beeinträchtigt sein.',
                'warning',
                6000
            );
            window.performanceWarningShown = true;
        }
    }
    // Berechne durchschnittliche Render-Zeit
    if (performanceMetrics.renderTimes.length > 10) {
        const recentRenders = performanceMetrics.renderTimes.slice(-10);
        const avgTime =
            recentRenders.reduce((sum, r) => sum + r.duration, 0) / recentRenders.length;
        if (avgTime > 300 && APP_CONFIG.DEBUG_MODE) {
            ErrorHandler.log(
                'checkPerformance',
                new Error('Slow average render time'),
                `${avgTime.toFixed(0)}ms average (should be <100ms)`
            );
        }
    }
}
function getPerformanceReport() {
    const report = {
        entities: performanceMetrics.entityCounts,
        totalEntities: Object.values(performanceMetrics.entityCounts).reduce((a, b) => a + b, 0),
        avgRenderTime:
            performanceMetrics.renderTimes.length > 0
                ? performanceMetrics.renderTimes.reduce((sum, r) => sum + r.duration, 0) /
                  performanceMetrics.renderTimes.length
                : 0,
        slowestRenders: performanceMetrics.renderTimes
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5)
    };
    console.table(report.entities);
    if (window.APP_CONFIG?.DEBUG_MODE && window.ErrorHandler) {
        window.ErrorHandler.log(
            'getPerformanceReport',
            new Error(`Durchschnittliche Render-Zeit: ${report.avgRenderTime.toFixed(2)}ms`),
            JSON.stringify(report.slowestRenders)
        );
    }
    return report;
}
// Export für Auto-Backup vor destruktiven Operationen; ehrliche Meldung dazu (R10) und das
// Mitentfernen beim Loeschen einer Kampagne (D2 = A, campaign-manager.js)
window.createAutoBackup = createAutoBackup;
window.reportSafetyBackup = reportSafetyBackup;
window.purgeCampaignBackups = purgeCampaignBackups;
// Gemeinsamer Restore-Schluss (restoreFromFileBackup in file-backup-ui.js) und
// Audio-Wiederbelebung (Code-Review 2026-09-21, R01)
window.applyRestoredCampaign = applyRestoredCampaign;
window.reviveReferencedSoundBlobs = reviveReferencedSoundBlobs;
// ============================================================
