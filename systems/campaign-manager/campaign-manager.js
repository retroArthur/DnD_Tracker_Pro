// [SECTION:CAMPAIGN_MANAGER]
// Was: features/dice/campaign-manager.js, Now: systems/campaign-manager/campaign-manager.js
// Kampagnen-Verwaltung
// Zeilen: 163
// ============================================================
// CAMPAIGN MANAGER
// ============================================================
// Alias für Rückwärtskompatibilität
// var initIndexedDB = window.initIndexedDB;  // [REMOVED: conflicts with function declaration]
const CAMPAIGN_INDEX_KEY = APP_CONFIG.CAMPAIGN_INDEX_KEY;
function getCampaignIndex() {
    return StorageAPI.getJSON(CAMPAIGN_INDEX_KEY, {
        campaigns: [],
        active: APP_CONFIG.STORAGE_KEY
    });
}
// Liefert das StorageAPI-Ergebnis ({success, error?}), damit Aufrufer einen gescheiterten
// Index-Write erkennen koennen (deleteCampaign bricht dann ab, R04/R07).
function saveCampaignIndex(index) {
    return StorageAPI.setJSON(CAMPAIGN_INDEX_KEY, index);
}
// Anzeigename einer Kampagne (Code-Review 2026-09-21, R05: Backup-Modal und
// Restore-Rueckfrage nennen die Kampagne): Standard-Kampagne, sonst der Name aus dem
// Index, sonst der Schluessel selbst.
function getCampaignDisplayName(key) {
    if (key === APP_CONFIG.STORAGE_KEY) return 'Standard-Kampagne';
    const index = getCampaignIndex();
    const campaigns = index && Array.isArray(index.campaigns) ? index.campaigns : [];
    const entry = campaigns.find(c => c && c.key === key);
    return entry && typeof entry.name === 'string' && entry.name !== '' ? entry.name : key;
}
// ============================================================
// KAMPAGNENANLAGE (Code-Review 2026-09-21, R07)
// INVARIANTE: der Index verweist nie auf eine Kampagne, deren Daten nicht gespeichert sind,
// und `active` aendert sich nur im letzten, einzigen Indexwrite. Reihenfolge: Daten
// (writeCampaignData: localStorage oder IndexedDB nach den Regeln von save()) -> EIN
// Indexwrite; jeder Fehlschlag nimmt die geschriebenen Daten wieder zurueck.
// ============================================================
/**
 * Liest den Kampagnenindex STRENG. Ein vorhandener, aber unlesbarer Index wird nie durch
 * einen Standardindex ersetzt: getJSON() liefert dann den Rueckfallwert, und wer den
 * zurueckschreibt, macht jeden Kampagneneintrag unerreichbar.
 * @returns {{ok: true, index: {campaigns: Array, active: string}} | {ok: false, error: string}}
 */
function readCampaignIndexStrict() {
    const raw = StorageAPI.get(CAMPAIGN_INDEX_KEY, null);
    if (raw === null) {
        return { ok: true, index: { campaigns: [], active: APP_CONFIG.STORAGE_KEY } };
    }
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return { ok: false, error: 'Kampagnenindex ist beschädigt' };
    }
    if (
        !parsed ||
        typeof parsed !== 'object' ||
        Array.isArray(parsed) ||
        !Array.isArray(parsed.campaigns)
    ) {
        return { ok: false, error: 'Kampagnenindex ist beschädigt' };
    }
    return { ok: true, index: parsed };
}
/**
 * Freier Schluessel fuer eine neue Kampagne: weder im Index noch in localStorage belegt. So
 * kann ein Rueckbau nie fremde Daten loeschen (zwei Anlagen in derselben Millisekunde
 * bekommen ein Zaehler-Suffix).
 * @param {{campaigns: Array}} index - streng gelesener Index
 * @returns {string}
 */
function newCampaignKey(index) {
    const taken = key =>
        index.campaigns.some(c => c && c.key === key) || StorageAPI.get(key, null) !== null;
    const base = 'dnd-campaign-' + Date.now();
    let key = base;
    for (let n = 1; taken(key); n++) key = base + '-' + n;
    return key;
}
/**
 * Entfernt die Daten einer eben angelegten, nicht in den Index uebernommenen Kampagne.
 * Nur localStorage beschrieben: gezielt dort (funktioniert auch ohne oeffnbare IndexedDB);
 * sonst ueber removeCampaignData() (IndexedDB mit bestaetigtem Commit, dann localStorage).
 * @param {string} key
 * @param {'localStorage'|'indexedDB'|null} backend - wohin writeCampaignData() geschrieben hat
 */
async function rollbackNewCampaignData(key, backend) {
    if (backend === 'localStorage') {
        StorageAPI.remove(key);
        StorageAPI.remove(key + '_ts');
        return;
    }
    const removal =
        typeof window.removeCampaignData === 'function'
            ? await window.removeCampaignData(key)
            : null;
    if ((!removal || !removal.success) && APP_CONFIG.DEBUG_MODE && window.ErrorHandler) {
        window.ErrorHandler.log(
            'addCampaignWithData',
            removal && removal.error,
            'Rueckbau der neuen Kampagne unvollstaendig: ' + key
        );
    }
}
/**
 * Legt eine Kampagne atomar an: Daten zuerst, danach EIN Indexwrite (Eintrag, bei
 * activate auch `active`). Scheitert ein Schritt, werden die Daten zurueckgenommen und der
 * Index bleibt byte-identisch. Wirft nie.
 * @param {string} name - Anzeigename
 * @param {object|string} data - vollstaendiger Kampagnenstand
 * @param {{activate?: boolean}} [options]
 * @returns {Promise<{success: true, key: string, backend: string} |
 *   {success: false, stage: 'index'|'data'|'unexpected', key?: string, error: *}>}
 */
async function addCampaignWithData(name, data, { activate = false } = {}) {
    let key = null;
    let backend = null;
    try {
        const before = readCampaignIndexStrict();
        if (!before.ok) return { success: false, stage: 'index', error: before.error };
        key = newCampaignKey(before.index);
        const write = await window.writeCampaignData(key, data);
        if (!write || !write.success) {
            await rollbackNewCampaignData(key, null);
            return { success: false, stage: 'data', key, error: write && write.error };
        }
        backend = write.backend;
        // Nach dem await frisch lesen: ein anderer Tab kann den Index inzwischen geaendert haben
        const current = readCampaignIndexStrict();
        if (!current.ok) {
            await rollbackNewCampaignData(key, backend);
            return { success: false, stage: 'index', key, error: current.error };
        }
        const next = Object.assign({}, current.index, {
            campaigns: current.index.campaigns.concat([
                { key, name, created: new Date().toISOString() }
            ])
        });
        if (activate) next.active = key;
        const indexResult = saveCampaignIndex(next);
        if (!indexResult || !indexResult.success) {
            await rollbackNewCampaignData(key, backend);
            return {
                success: false,
                stage: 'index',
                key,
                error: (indexResult && indexResult.error) || 'Index nicht gespeichert'
            };
        }
        return { success: true, key, backend };
    } catch (error) {
        if (key) await rollbackNewCampaignData(key, backend);
        return {
            success: false,
            stage: 'unexpected',
            key,
            error: (error && error.message) || String(error)
        };
    }
}
// Doppelklick-Schutz: waehrend einer laufenden Anlage (IndexedDB-Rueckfall ist asynchron)
// wird ein zweiter Klick ignoriert
let _campaignCreateInFlight = false;
// async (R07): der data-action-'call'-Dispatcher ignoriert das Promise; die Funktion lehnt nie ab
async function createCampaign() {
    const input = $('new-campaign-name');
    if (!input || _campaignCreateInFlight) return;
    const name = input.value.trim().slice(0, 100);
    if (!name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }
    _campaignCreateInFlight = true;
    input.disabled = true;
    try {
        // Vollstaendiges Grundgeruest aus initializeData(); eine neue Kampagne wird nicht aktiviert
        const result = await addCampaignWithData(name, window.initializeData());
        if (!result.success) {
            if (window.ErrorHandler) {
                window.ErrorHandler.log(
                    'createCampaign',
                    new Error(String(result.error)),
                    result.stage
                );
            }
            showToast('❌ Fehler beim Erstellen der Kampagne', 'error');
            return;
        }
        input.value = '';
        renderCampaignList();
        showToast(`Kampagne "${name}" erstellt`);
    } finally {
        input.disabled = false;
        _campaignCreateInFlight = false;
    }
}
function switchCampaign(key) {
    const index = getCampaignIndex();
    index.active = key;
    // Nur neu laden, wenn der Wechsel wirklich gespeichert ist (R07)
    const result = saveCampaignIndex(index);
    if (!result || !result.success) {
        showToast('❌ Kampagnenwechsel fehlgeschlagen (Speicher voll?)', 'error');
        return;
    }
    location.reload();
}
// Loescht die Kampagne, die DIESER Tab zeigt (getActiveCampaignKey), nicht index.active:
// nach einem Wechsel in einem anderen Tab oder einem gescheiterten Import koennen beide
// auseinanderlaufen. Reihenfolge (R04/R07): Index zuerst (benannte Kampagne), dann
// removeCampaignData() — IndexedDB-Delete mit bestaetigtem Commit VOR localStorage.
// Erfolgsmeldung und Navigation erst danach.
async function deleteCampaign() {
    const key =
        typeof window.getActiveCampaignKey === 'function' ? window.getActiveCampaignKey() : null;
    if (!key) {
        alert(
            '❌ Fehler beim Löschen:\n\nDie aktive Kampagne konnte nicht bestimmt werden. Es wurde nichts gelöscht.'
        );
        return;
    }
    const isDefault = key === APP_CONFIG.STORAGE_KEY;
    const index = getCampaignIndex();
    // Datengröße ermitteln
    const dataSize = localStorage.getItem(key);
    const sizeKB = dataSize ? (dataSize.length / 1024).toFixed(1) : 0;
    const campaignName = isDefault
        ? 'Standard-Kampagne'
        : index.campaigns.find(c => c.key === key)?.name || 'Unbekannt';
    if (
        !confirm(
            `⚠️ "${campaignName}" LÖSCHEN?\n\nAlle Daten (${sizeKB} KB) werden gelöscht:\n- Charaktere, NPCs, Orte\n- Quests, Encounters\n- Initiative, Beute\n- Wiki, Netzwerk\n- Sessions\n- Automatische Backups dieser Kampagne\n\nDieser Vorgang kann NICHT rückgängig gemacht werden!`
        )
    ) {
        return;
    }
    // Soundboard-Audio stoppen — Web Audio überlebt sonst den D-Reset und spielt im Hintergrund weiter
    if (typeof window.stopAllTracks === 'function') window.stopAllTracks();
    try {
        log('[deleteCampaign] Lösche Kampagne:', key);
        // 1. Benannte Kampagne: zuerst aus dem Index entfernen (frisch gelesen). Die aktive
        //    Auswahl eines anderen Tabs bleibt stehen; scheitert der Write, wird nichts geloescht.
        if (!isDefault) {
            const current = getCampaignIndex();
            const next = Object.assign({}, current, {
                campaigns: (current.campaigns || []).filter(c => c.key !== key)
            });
            if (current.active === key) next.active = APP_CONFIG.STORAGE_KEY;
            const indexResult = saveCampaignIndex(next);
            if (!indexResult || !indexResult.success) {
                alert(
                    '❌ Fehler beim Löschen:\n\nDer Kampagnenindex konnte nicht gespeichert werden. Es wurde nichts gelöscht.'
                );
                return;
            }
        }
        // 2. Gespeicherte Daten entfernen: IndexedDB (bestaetigter Commit) VOR localStorage
        const removal = await window.removeCampaignData(key);
        if (!removal || !removal.success) {
            if (window.ErrorHandler) {
                window.ErrorHandler.log(
                    'deleteCampaign',
                    removal && removal.error,
                    'Kampagnendaten konnten nicht entfernt werden'
                );
            }
            if (isDefault) {
                alert(
                    '❌ Fehler beim Löschen:\n\nDie IndexedDB-Kopie konnte nicht entfernt werden. Es wurde nichts gelöscht.'
                );
                return;
            }
            alert(
                `⚠️ "${campaignName}" wurde aus der Liste entfernt, aber die gespeicherten Daten konnten nicht vollständig gelöscht werden.`
            );
        } else {
            log('[deleteCampaign] Kampagnendaten entfernt');
            // D2 = A: auch die Auto-Backups dieser Kampagne entfernen — erst NACH dem
            // erfolgreichen Entfernen der Daten; ein Fehler hier haelt das Loeschen nicht auf
            if (typeof window.purgeCampaignBackups === 'function') {
                const purge = await window.purgeCampaignBackups(key);
                if (!purge.success && APP_CONFIG.DEBUG_MODE && window.ErrorHandler) {
                    window.ErrorHandler.log(
                        'deleteCampaign',
                        purge.error,
                        'Auto-Backups der Kampagne konnten nicht entfernt werden'
                    );
                }
            }
        }
        // 3. Globales D-Objekt zurücksetzen (falls Seite nicht neu lädt) — vollstaendiges
        //    Grundgeruest aus initializeData(), in place (D ist const)
        window.replaceCampaignData(window.D, window.initializeData());
        if (removal && removal.success) {
            alert(`✅ "${campaignName}" wurde gelöscht!\n\nDie Seite wird neu geladen...`);
        }
        // 4. Seite mit Cache-Bypass neu laden
        window.location.href = window.location.pathname + '?cleared=' + Date.now();
    } catch (error) {
        if (window.ErrorHandler) {
            window.ErrorHandler.log('deleteCampaign', error);
        }
        alert('❌ Fehler beim Löschen:\n\n' + error.message);
    }
}
function renderCampaignList() {
    const c = $('campaign-list');
    if (!c) return;
    const index = getCampaignIndex();
    // Standard campaign
    let html = `<div class="campaign-item ${index.active === APP_CONFIG.STORAGE_KEY ? 'active' : ''}" data-action="switch-campaign" data-value="${APP_CONFIG.STORAGE_KEY}">
        <div>
            <div class="campaign-name">📚 Standard-Kampagne</div>
            <div class="campaign-info">Ursprüngliche Daten</div>
        </div>
        ${index.active === APP_CONFIG.STORAGE_KEY ? '<span style="color:var(--green);">✓ Aktiv</span>' : ''}
    </div>`;
    // Other campaigns
    index.campaigns.forEach(camp => {
        html += `<div class="campaign-item ${index.active === camp.key ? 'active' : ''}" data-action="switch-campaign" data-value="${camp.key}">
            <div>
                <div class="campaign-name">${esc(camp.name)}</div>
                <div class="campaign-info">Erstellt: ${formatDate(camp.created)}</div>
            </div>
            ${index.active === camp.key ? '<span style="color:var(--green);">✓ Aktiv</span>' : ''}
        </div>`;
    });
    c.innerHTML = html;
}
// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================
window.getCampaignIndex = getCampaignIndex;
window.getCampaignDisplayName = getCampaignDisplayName;
window.readCampaignIndexStrict = readCampaignIndexStrict;
window.addCampaignWithData = addCampaignWithData;
window.createCampaign = createCampaign;
window.switchCampaign = switchCampaign;
window.deleteCampaign = deleteCampaign;
