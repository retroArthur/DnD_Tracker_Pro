// [SECTION:FULL_EXPORT]
// ============================================================
// Vollstaendiger Kampagnen-Export fuer Daten-Migration (file:// -> PWA)
// Implementierung: Phase 2, Plan 03 (D-08)
// Analog: systems/spellslots/import-export.js (IO_SCHEMA, exportData, executeImport)
// ============================================================

// Schema fuer Nutzerdaten
const FULL_EXPORT_SCHEMA = {
    _exportType: 'full-v1',
    fields: {
        campaigns: { type: 'object', required: true },
        settings: { type: 'object', required: false, default: {} },
        diceFavorites: { type: 'array', required: false, default: [] },
        dmScreenProfiles: { type: 'object', required: false, default: {} },
        campaignIndex: { type: 'object', required: true }
    }
};
// Gemeinsame Obergrenzen für Download und Umzugs-Assistent.
const FULL_MIGRATION_MAX_BYTES = 64 * 1024 * 1024;
const FULL_MIGRATION_MAX_CAMPAIGNS = 100;
let fullImportInProgress = false;

// ============================================================
// BUILD — Voll-Export-Objekt erstellen (alle Kampagnen + Meta)
// Analog: RESEARCH.md Code Example "Voll-Export-Format"
// ============================================================
async function _readFullExportCampaignData(key) {
    let raw = StorageAPI.get(key, null);
    // Wie beim Start: Ein Wert ohne Zeitstempel kann ein alter localStorage-Schatten sein.
    if (!raw || !StorageAPI.get(key + '_ts', null)) {
        const record = await window.loadFromIndexedDBFallbackRaw(key);
        if (record) raw = record.data;
    }
    if (raw === null) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('keine gültigen Kampagnendaten');
    }
    return data;
}

async function buildFullExport() {
    const campaignIndex = window.getCampaignIndex ? window.getCampaignIndex() : getCampaignIndex();
    const storageKey = APP_CONFIG.STORAGE_KEY;
    const activeKey = campaignIndex?.active || storageKey;
    const allCampaigns = {};
    const targets = new Map([[storageKey, { key: storageKey, name: 'Standard-Kampagne' }]]);
    for (const campaign of campaignIndex?.campaigns || []) targets.set(campaign.key, campaign);
    if (!targets.has(activeKey)) targets.set(activeKey, { key: activeKey, name: activeKey });

    for (const [key, meta] of targets) {
        try {
            const data = await _readFullExportCampaignData(key);
            // Eine noch nie gespeicherte Standard-Kampagne muss nicht exportiert werden.
            if (data === null) {
                if (key === storageKey) continue;
                throw new Error('keine gültigen Kampagnendaten');
            }
            // SRD- und eigene Zauber teilen dieselbe Sammlung ohne verlässliche Herkunftskennung.
            allCampaigns[key] = { meta, data };
        } catch (error) {
            throw new Error(`Kampagne „${meta.name || key}“ konnte nicht gelesen werden: ${error.message}`);
        }
    }

    if (Object.keys(allCampaigns).length > FULL_MIGRATION_MAX_CAMPAIGNS) {
        throw new Error(
            `Die Umzugsdatei darf höchstens ${FULL_MIGRATION_MAX_CAMPAIGNS} Kampagnen enthalten. ` +
                'Exportiere die Kampagnen einzeln.'
        );
    }

    const D = window.D;

    return {
        _exportType: 'full-v1',
        _appVersion: APP_CONFIG.VERSION,
        _exportDate: new Date().toISOString(),
        _activeCampaignKey: activeKey,
        campaigns: allCampaigns,
        settings: (D && D.settings) ? D.settings : {},
        diceFavorites: StorageAPI.getJSON(APP_CONFIG.DICE_FAV_KEY, []),
        dmScreenProfiles: (D && D.dmScreenProfiles) ? D.dmScreenProfiles : {},
        campaignIndex: campaignIndex
    };
}

// ============================================================
// DOWNLOAD — Blob + Anchor Download (Muster: exportData in import-export.js)
// ============================================================
async function downloadFullExport() {
    try {
        if (!(await window.flushPendingSaveAndSettle())) {
            throw new Error('Ausstehende Kampagnenänderungen konnten nicht gespeichert werden.');
        }
        const exportObj = await buildFullExport();
        const json = JSON.stringify(exportObj);
        const blob = new Blob([json], { type: 'application/json' });
        if (blob.size > FULL_MIGRATION_MAX_BYTES) {
            throw new Error('Die Umzugsdatei überschreitet 64 MiB. Exportiere die Kampagnen einzeln.');
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const datum = new Date().toISOString().split('T')[0];
        a.download = 'dnd-tracker-umzug-' + datum + '.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Umzugs-Export heruntergeladen');
        return true;
    } catch (err) {
        if (APP_CONFIG.DEBUG_MODE) {
            ErrorHandler.log('downloadFullExport', err, 'Export fehlgeschlagen');
        }
        showToast('Export fehlgeschlagen: ' + err.message, 'error');
        return false;
    }
}

// ============================================================
// IMPORT — Alle Kampagnen wiederherstellen (T-02-08 / T-02-11)
// Analog: executeImport + StorageAPI error handling (import-export.js L558-568)
// ============================================================
async function importFullExport(parsedObj) {
    if (fullImportInProgress) throw new Error('Ein Umzugsimport läuft bereits');
    fullImportInProgress = true;
    try {
        const { journalCleanup, ...result } = await window.withCampaignIndexLock(
            (assertHeld, runRollback, importJournal) =>
                _importFullExport(parsedObj, assertHeld, runRollback, importJournal)
        );
        // Der Assistent darf direkt nach dem Import neu laden.
        await journalCleanup;
        return result;
    } finally {
        fullImportInProgress = false;
    }
}

async function _rollbackFullImport(id, receipts, importJournal, assertHeld) {
    let journalError;
    const entries = await importJournal(store => store.getAll()).catch(error => {
        journalError = error;
        return [];
    });
    const batches = [{ id, receipts: [...receipts] }, ...entries.filter(entry => entry.receipts)];
    const failed = new Set();
    let restored;
    do {
        restored = false;
        for (const batch of batches) {
            for (let i = 0; i < batch.receipts.length; i++) {
                const receipt = batch.receipts[i];
                if (!receipt) continue;
                assertHeld();
                try {
                    if (!(await window.rollbackCampaignOverwrite(receipt))) continue;
                    restored = true;
                } catch {
                    failed.add(receipt.key);
                }
                batch.receipts[i] = null;
            }
        }
    } while (restored && batches.some(batch => batch.receipts.some(Boolean)));

    // Ein noch laufender Folgeimport kann einen momentan fremden Stand wieder
    // freigeben. Sein Rückbau prüft dann auch die hier zurückgestellten Belege.
    assertHeld();
    await importJournal(store => {
        const current = store.getAll();
        current.onsuccess = () => {
            const othersActive = current.result.some(entry => entry.id !== id && !entry.receipts);
            for (const batch of batches) {
                const pending = batch.receipts.filter(Boolean);
                if (othersActive && pending.length) store.put({ id: batch.id, receipts: pending });
                else store.delete(batch.id);
            }
        };
    });
    if (journalError) {
        throw new Error('Das Rückbaujournal konnte nicht vollständig gelesen werden.', { cause: journalError });
    }
    return [...failed];
}

async function _importFullExport(parsedObj, assertHeld, runRollback, importJournal) {
    // T-02-08: _exportType-Pruefung
    if (!parsedObj || parsedObj._exportType !== 'full-v1') {
        throw new Error('Ungueltige Datei — kein full-v1-Export');
    }
    if (!parsedObj.campaigns || typeof parsedObj.campaigns !== 'object') {
        throw new Error('Ungueltige Datei — Kampagnendaten fehlen');
    }
    if (!parsedObj.campaignIndex || typeof parsedObj.campaignIndex !== 'object') {
        throw new Error('Ungueltige Datei — Kampagnen-Index fehlt');
    }

    const campaignEntries = Object.entries(parsedObj.campaigns);
    let totalBytes = 0;

    // WR-03: Mengenlimit — eine manipulierte Datei darf nicht beliebig viele
    // localStorage-Keys anlegen (DoS/Quota)
    if (campaignEntries.length > FULL_MIGRATION_MAX_CAMPAIGNS) {
        throw new Error(`Zu viele Kampagnen in der Datei (max ${FULL_MIGRATION_MAX_CAMPAIGNS})`);
    }

    // WR-03/SENKEN: die Keys der (fremden) Datei werden 1:1 localStorage-Keys. Nur die Formate,
    // die die App selbst schreibt: Standard-Kampagne (APP_CONFIG.STORAGE_KEY, frueher
    // 'dnd-tracker'/'dnd-tracker-vN') und 'dnd-campaign-<Date.now()>[-N]' (newCampaignKey).
    // Die alte Regel /^(dnd-tracker(-|$)|dnd-campaign-)/ liess JEDEN App-Key durch, auch
    // dnd-tracker-backups/-campaigns/-theme und `_ts`-Begleiter (Gutachten, Sonde G).
    const istKampagnenKey = key => typeof key === 'string' && key.length <= 200 &&
        (key === APP_CONFIG.STORAGE_KEY || /^(?:dnd-tracker(?:-v\d+)?|dnd-campaign-\d+(?:-\d+)?)$/.test(key));
    for (const [key] of campaignEntries) {
        if (!istKampagnenKey(key)) throw new Error('Unerwarteter Kampagnen-Key: ' + key);
    }

    // CR-01 (Phase 12, Review-Fix): Formkorrektheit ALLER Kampagnen-Eintraege
    // VOR der Schreibschleife pruefen — sonst wuerden bereits gueltige, frueher
    // in campaignEntries stehende Kampagnen per StorageAPI.setJSON() geschrieben,
    // bevor ein spaeterer Formfehler den throw ausloest. Das hinterliesse
    // teilweise geschriebene, aus dem Kampagnen-Index nicht mehr erreichbare
    // Kampagnendaten in localStorage, obwohl der Wizard "Import fehlgeschlagen"
    // meldet (analog zur bereits bestehenden Key-Whitelist-Vorschleife oben).
    for (const [key, campaign] of campaignEntries) {
        if (!campaign?.data || typeof campaign.data !== 'object' || Array.isArray(campaign.data)) {
            throw new Error('Kampagne "' + key + '" hat keine gueltigen Daten');
        }
    }

    // Die ganze Datei prüfen und migrieren, bevor der erste Schreibvorgang beginnt.
    const prepared = campaignEntries.map(([key, campaign]) => {
        // T-02-08: migrateData pro Kampagne (Sanitierung + Versions-Migration)
        // Datengrenze (Vertrag SENKEN R4, docs/bugfixes.md): VOR der Migration, weil die Datei
        // fremd ist (verbotene Schluessel, Zahlenfelder als Text), und danach noch einmal,
        // weil die Migration Felder aus Altformaten nachfuellt.
        let migratedData = bereinigeDatengrenze(campaign.data);
        if (typeof migrateData === 'function') {
            migratedData = migrateData(migratedData);
        } else if (typeof window.migrateData === 'function') {
            migratedData = window.migrateData(migratedData);
        }
        return [key, JSON.stringify(bereinigeDatengrenze(migratedData))];
    });
    // Kampagnen-Index wiederherstellen — SEC-05 (Plan 12-16): ZUSAMMENFUEHREN statt
    // zu ersetzen. Ein lokaler Index-Eintrag, dessen Key im Import nicht vorkommt,
    // wuerde sonst unerreichbar: die Kampagnendaten selbst bleiben unter ihrem Key
    // in localStorage liegen, nur der Verweis im Index verschwindet (T-12-65).
    // Der Import gewinnt dort, wo er auch Kampagnendaten schreibt. Alte Dateien
    // konnten IndexedDB-Kampagnen auslassen und dennoch im Index aufführen.
    const saveCampaignIndexFn = typeof saveCampaignIndex === 'function'
        ? saveCampaignIndex
        : window.saveCampaignIndex;
    const getCampaignIndexFn = typeof getCampaignIndex === 'function'
        ? getCampaignIndex
        : window.getCampaignIndex;
    const pruefeIndexErgebnis = indexResult => {
        if (!indexResult || indexResult.success !== true) {
            throw new Error(
                'Kampagnenindex konnte nicht gespeichert werden' +
                (indexResult && indexResult.error ? ' (' + indexResult.error + ')' : '')
            );
        }
    };
    const writeIndex = async () => {
        if (typeof saveCampaignIndexFn !== 'function') return 0;
        // Datengrenze (Vertrag SENKEN R4, docs/bugfixes.md): auch der Index kommt aus der
        // Datei. Verbotene Schluessel fallen in jeder Tiefe; ein Eintrag bleibt nur mit einem
        // Schluessel mit bestätigtem Kampagnenwrite. Der lokale Index bleibt für
        // Kampagnen ohne Importdaten maßgeblich.
        const importedIndex = bereinigeDatengrenze(parsedObj.campaignIndex);
        if (importedIndex && typeof importedIndex === 'object') {
            const writtenKeys = new Set(prepared.map(([key]) => key));
            const importedCampaigns = (
                Array.isArray(importedIndex.campaigns) ? importedIndex.campaigns : []
            ).filter(c => c && typeof c === 'object' && writtenKeys.has(c.key));
            const campaignsOf = index => (Array.isArray(index?.campaigns) ? index.campaigns : []);
            const localIndex =
                typeof getCampaignIndexFn === 'function' ? getCampaignIndexFn() : null;
            const importedKeys = new Set(importedCampaigns.map(c => c.key));
            const localKeys = new Set(campaignsOf(localIndex).map(c => c?.key));
            const storageKey = APP_CONFIG.STORAGE_KEY;
            const requested = istKampagnenKey(importedIndex.active)
                ? importedIndex.active
                : storageKey;
            let active = storageKey;
            let checkedLocalData = false;
            for (const key of new Set([requested, localIndex?.active])) {
                if (key === storageKey || writtenKeys.has(key)) {
                    active = key;
                    break;
                }
                if (!istKampagnenKey(key) || !localKeys.has(key)) continue;
                checkedLocalData = true;
                try {
                    if ((await _readFullExportCampaignData(key)) !== null) {
                        active = key;
                        break;
                    }
                } catch {
                    // Nicht lesbare Kampagnen bleiben im lokalen Index, werden aber nicht aktiviert.
                }
            }
            // Andere Indexschreiber können während der IndexedDB-Abfrage fertig werden.
            const currentIndex = checkedLocalData ? getCampaignIndexFn() : localIndex;
            const keptLocalCampaigns = campaignsOf(currentIndex).filter(
                c => c && !importedKeys.has(c.key)
            );
            // Auch bestätigte Kampagnendaten ohne Datei-Eintrag bleiben auswählbar.
            // Die Standardkampagne erscheint von selbst, vorhandene Metadaten haben Vorrang.
            const listedKeys = new Set([...importedKeys, ...keptLocalCampaigns.map(c => c.key)]);
            const unlistedCampaigns = campaignEntries
                .filter(([key]) => key !== storageKey && !listedKeys.has(key))
                .map(([key, campaign]) => {
                    const meta = bereinigeDatengrenze(campaign.meta);
                    const name = typeof meta?.name === 'string' ? meta.name.trim() : '';
                    const created = meta?.created;
                    return {
                        key,
                        name: name || key,
                        created:
                            typeof created === 'string' && Number.isFinite(Date.parse(created))
                                ? created
                                : new Date().toISOString()
                    };
                });
            if (
                active !== storageKey &&
                !writtenKeys.has(active) &&
                !keptLocalCampaigns.some(c => c.key === active)
            ) {
                active = storageKey;
            }
            const mergedIndex = Object.assign({}, importedIndex, {
                campaigns: importedCampaigns.concat(keptLocalCampaigns, unlistedCampaigns),
                active
            });
            assertHeld();
            pruefeIndexErgebnis(saveCampaignIndexFn(mergedIndex));
            return keptLocalCampaigns.length;
        }
        assertHeld();
        pruefeIndexErgebnis(saveCampaignIndexFn(importedIndex));
        return 0;
    };

    // Erst Kampagnen bestätigen, dann den Index veröffentlichen. Bis dahin kann
    // jeder bestätigte Kampagnenwrite auf seine vorherigen Speicherwerte zurück.
    const written = [];
    const importId = await importJournal(store => store.add({ receipts: null }));
    let preservedIndexEntriesCount;
    try {
        for (const [key, data] of prepared) {
            assertHeld();
            const result = await window.writeCampaignData(key, data, { withRollback: true });
            if (!result.success) {
                throw new Error('Speichern fehlgeschlagen: ' + (result.error || 'Unbekannter Fehler'));
            }
            if (result.rollback) written.push(result.rollback);
            totalBytes += data.length;
        }
        assertHeld();
        preservedIndexEntriesCount = await writeIndex();
    } catch (error) {
        written.reverse();
        const failed = await runRollback(assertRollbackHeld =>
            _rollbackFullImport(importId, written, importJournal, assertRollbackHeld)
        );
        if (failed.length) {
            throw new Error(`${error.message}. Rückabwicklung fehlgeschlagen für ${failed.join(', ')}.`);
        }
        throw error;
    }
    // Den Mutex nach der Veröffentlichung freigeben. Der Aufrufer wartet
    // danach auf die Journalbereinigung.
    const journalCleanup = importJournal(store => {
        const entries = store.getAll();
        entries.onsuccess = () => {
            store.delete(importId);
            if (!entries.result.some(entry => entry.id !== importId && !entry.receipts)) {
                for (const entry of entries.result) {
                    if (entry.receipts) store.delete(entry.id);
                }
            }
        };
    }).catch(error => window.ErrorHandler?.log?.('importFullExport', error, 'Rückbaujournal'));

    // WR-04 / SEC-05 (Plan 12-16): Wuerfel-Favoriten wiederherstellen — sie liegen
    // unter einem EIGENEN localStorage-Key (DICE_FAV_KEY) und sind NICHT Teil der
    // Kampagnendaten. Der Export enthaelt sie bereits (buildFullExport); ohne diesen
    // Schritt gingen sie beim Umzug verloren (WR-04).
    // SEC-05: ZUSAMMENFUEHREN statt zu ersetzen — ein einmaliger, unumkehrbarer
    // Import darf lokal angelegte Favoriten nicht kommentarlos loeschen (T-12-64).
    // Gleichheit heisst gleicher Name UND gleiche Notation (Form { name, notation },
    // KEIN id-Feld — features/dice/dice-favorites.js:9-14); fehlt einem Eintrag eines
    // der beiden Felder, entscheidet ein Vergleich der serialisierten Form, nie ein
    // Verwerfen im Zweifel. Reihenfolge: lokaler Bestand zuerst, dann importierte
    // Eintraege, die darin noch nicht vorkommen.
    let preservedFavoritesCount = 0;
    if (Array.isArray(parsedObj.diceFavorites) && parsedObj.diceFavorites.length > 0 &&
            typeof APP_CONFIG !== 'undefined' && APP_CONFIG.DICE_FAV_KEY) {
        const existingFavorites = StorageAPI.getJSON(APP_CONFIG.DICE_FAV_KEY, []);
        const localFavorites = Array.isArray(existingFavorites) ? existingFavorites : [];
        const favoriteKey = fav => {
            if (fav && typeof fav === 'object' &&
                    typeof fav.name === 'string' && typeof fav.notation === 'string') {
                return fav.name + '\0' + fav.notation;
            }
            return JSON.stringify(fav);
        };
        const localKeys = new Set(localFavorites.map(favoriteKey));
        const newFavorites = parsedObj.diceFavorites.filter(fav => !localKeys.has(favoriteKey(fav)));
        preservedFavoritesCount = localFavorites.length;
        StorageAPI.setJSON(APP_CONFIG.DICE_FAV_KEY, localFavorites.concat(newFavorites));
    }

    return {
        journalCleanup,
        campaignCount: campaignEntries.length,
        totalBytes: totalBytes,
        preservedFavoritesCount: preservedFavoritesCount,
        preservedIndexEntriesCount: preservedIndexEntriesCount
    };
}

// ============================================================
// EXPORTS
// ============================================================
window.FULL_EXPORT_SCHEMA = FULL_EXPORT_SCHEMA;
window.FULL_MIGRATION_MAX_BYTES = FULL_MIGRATION_MAX_BYTES;
window.buildFullExport = buildFullExport;
window.downloadFullExport = downloadFullExport;
window.importFullExport = importFullExport;
