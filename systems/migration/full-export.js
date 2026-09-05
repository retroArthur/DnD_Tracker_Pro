// [SECTION:FULL_EXPORT]
// ============================================================
// Vollstaendiger Kampagnen-Export fuer Daten-Migration (file:// -> PWA)
// Implementierung: Phase 2, Plan 03 (D-08)
// Analog: systems/spellslots/import-export.js (IO_SCHEMA, exportData, executeImport)
// ============================================================

// Schema fuer Nutzerdaten (OHNE SRD-Spells — Pitfall 6 / T-02-09)
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

// Felder, die SRD-Daten enthalten und nicht exportiert werden duerfen (T-02-09)
const SRD_FIELDS = ['spells'];

// ============================================================
// STRIP — SRD-Daten aus Kampagnendaten entfernen
// ============================================================
function stripNonUserData(data) {
    if (!data || typeof data !== 'object') return data;
    const result = Object.assign({}, data);
    for (const field of SRD_FIELDS) {
        delete result[field];
    }
    return result;
}

// ============================================================
// BUILD — Voll-Export-Objekt erstellen (alle Kampagnen + Meta)
// Analog: RESEARCH.md Code Example "Voll-Export-Format"
// ============================================================
function buildFullExport() {
    const campaignIndex = window.getCampaignIndex ? window.getCampaignIndex() : getCampaignIndex();
    const storageKey = APP_CONFIG.STORAGE_KEY;
    const allCampaigns = {};

    // Alle benannten Kampagnen aus dem Index sammeln
    if (campaignIndex && Array.isArray(campaignIndex.campaigns)) {
        for (const campaign of campaignIndex.campaigns) {
            const data = StorageAPI.getJSON(campaign.key, null);
            if (data) {
                allCampaigns[campaign.key] = {
                    meta: campaign, // { key, name, created }
                    data: stripNonUserData(data)
                };
            }
        }
    }

    // Standard-Kampagne immer einschliessen (auch wenn nicht im Index)
    const defaultData = StorageAPI.getJSON(storageKey, null);
    if (defaultData && !allCampaigns[storageKey]) {
        allCampaigns[storageKey] = {
            meta: { key: storageKey, name: 'Standard-Kampagne' },
            data: stripNonUserData(defaultData)
        };
    }

    const D = window.D;

    return {
        _exportType: 'full-v1',
        _appVersion: APP_CONFIG.VERSION,
        _exportDate: new Date().toISOString(),
        _activeCampaignKey: campaignIndex ? campaignIndex.active : storageKey,
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
function downloadFullExport() {
    try {
        const exportObj = buildFullExport();
        const json = JSON.stringify(exportObj, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const datum = new Date().toISOString().split('T')[0];
        a.download = 'dnd-tracker-umzug-' + datum + '.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Umzugs-Export heruntergeladen');
    } catch (err) {
        if (APP_CONFIG.DEBUG_MODE) {
            ErrorHandler.log('downloadFullExport', err, 'Export fehlgeschlagen');
        }
        showToast('Export fehlgeschlagen: ' + err.message, 'error');
    }
}

// ============================================================
// IMPORT — Alle Kampagnen wiederherstellen (T-02-08 / T-02-11)
// Analog: executeImport + StorageAPI error handling (import-export.js L558-568)
// ============================================================
function importFullExport(parsedObj) {
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
    const MAX_IMPORT_CAMPAIGNS = 100;
    if (campaignEntries.length > MAX_IMPORT_CAMPAIGNS) {
        throw new Error('Zu viele Kampagnen in der Datei (max ' + MAX_IMPORT_CAMPAIGNS + ')');
    }

    // WR-03: Key-Whitelist — die Keys aus der (nicht vertrauenswuerdigen) Datei
    // werden 1:1 als localStorage-Keys verwendet. Nur echte Kampagnen-Key-Formate
    // zulassen: 'dnd-tracker-*' (Standard-Kampagne, core/config.js) und
    // 'dnd-campaign-*' (benannte Kampagnen, campaign-manager.js createCampaign).
    const ALLOWED_KEY_RE = /^(dnd-tracker(-|$)|dnd-campaign-)/;
    for (const [key] of campaignEntries) {
        if (typeof key !== 'string' || key.length > 200 || !ALLOWED_KEY_RE.test(key)) {
            throw new Error('Unerwarteter Kampagnen-Key: ' + key);
        }
    }

    // CR-01 (Phase 12, Review-Fix): Formkorrektheit ALLER Kampagnen-Eintraege
    // VOR der Schreibschleife pruefen — sonst wuerden bereits gueltige, frueher
    // in campaignEntries stehende Kampagnen per StorageAPI.setJSON() geschrieben,
    // bevor ein spaeterer Formfehler den throw ausloest. Das hinterliesse
    // teilweise geschriebene, aus dem Kampagnen-Index nicht mehr erreichbare
    // Kampagnendaten in localStorage, obwohl der Wizard "Import fehlgeschlagen"
    // meldet (analog zur bereits bestehenden Key-Whitelist-Vorschleife oben).
    for (const [key, campaign] of campaignEntries) {
        if (!campaign.data || typeof campaign.data !== 'object') {
            throw new Error('Kampagne "' + key + '" hat keine gueltigen Daten');
        }
    }

    // Jede Kampagne migrieren und speichern
    for (const [key, campaign] of campaignEntries) {
        // T-02-08: migrateData pro Kampagne (Sanitierung + Versions-Migration)
        let migratedData = campaign.data;
        if (typeof migrateData === 'function') {
            migratedData = migrateData(campaign.data);
        } else if (typeof window.migrateData === 'function') {
            migratedData = window.migrateData(campaign.data);
        }

        // Kampagnendaten speichern — mit {success, error}-Pruefung (StorageAPI-Muster)
        const saveResult = StorageAPI.setJSON(key, migratedData);
        if (!saveResult.success) {
            throw new Error('Speichern fehlgeschlagen: ' + (saveResult.error || 'Unbekannter Fehler'));
        }
        totalBytes += JSON.stringify(migratedData).length;
    }

    // Kampagnen-Index wiederherstellen — SEC-05 (Plan 12-16): ZUSAMMENFUEHREN statt
    // zu ersetzen. Ein lokaler Index-Eintrag, dessen Key im Import nicht vorkommt,
    // wuerde sonst unerreichbar: die Kampagnendaten selbst bleiben unter ihrem Key
    // in localStorage liegen, nur der Verweis im Index verschwindet (T-12-65).
    // Regel (siehe <design_note> im Plan): der Import gewinnt, wo beide dasselbe
    // meinen (ueberschneidende Keys) — erhalten bleibt nur, was der Import gar
    // nicht kennt. `active` stammt immer aus dem Import.
    const saveCampaignIndexFn = typeof saveCampaignIndex === 'function'
        ? saveCampaignIndex
        : window.saveCampaignIndex;
    const getCampaignIndexFn = typeof getCampaignIndex === 'function'
        ? getCampaignIndex
        : window.getCampaignIndex;
    let preservedIndexEntriesCount = 0;
    if (typeof saveCampaignIndexFn === 'function') {
        const importedIndex = parsedObj.campaignIndex;
        if (importedIndex && typeof importedIndex === 'object') {
            const importedCampaigns = Array.isArray(importedIndex.campaigns) ? importedIndex.campaigns : [];
            let localCampaigns = [];
            if (typeof getCampaignIndexFn === 'function') {
                const localIndex = getCampaignIndexFn();
                if (localIndex && Array.isArray(localIndex.campaigns)) {
                    localCampaigns = localIndex.campaigns;
                }
            }
            const importedKeys = new Set(importedCampaigns.map(c => c && c.key));
            const keptLocalCampaigns = localCampaigns.filter(c => c && !importedKeys.has(c.key));
            preservedIndexEntriesCount = keptLocalCampaigns.length;
            const mergedIndex = Object.assign({}, importedIndex, {
                campaigns: importedCampaigns.concat(keptLocalCampaigns),
                active: importedIndex.active
            });
            saveCampaignIndexFn(mergedIndex);
        } else {
            saveCampaignIndexFn(importedIndex);
        }
    }

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
                return fav.name + ' ' + fav.notation;
            }
            return JSON.stringify(fav);
        };
        const localKeys = new Set(localFavorites.map(favoriteKey));
        const newFavorites = parsedObj.diceFavorites.filter(fav => !localKeys.has(favoriteKey(fav)));
        preservedFavoritesCount = localFavorites.length;
        StorageAPI.setJSON(APP_CONFIG.DICE_FAV_KEY, localFavorites.concat(newFavorites));
    }

    return {
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
window.stripNonUserData = stripNonUserData;
window.buildFullExport = buildFullExport;
window.downloadFullExport = downloadFullExport;
window.importFullExport = importFullExport;
