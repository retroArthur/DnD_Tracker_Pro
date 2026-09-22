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
function createCampaign() {
    const input = $('new-campaign-name');
    if (!input) return;
    const name = input.value.trim();
    if (!name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }
    const index = getCampaignIndex();
    const key = 'dnd-campaign-' + Date.now();
    index.campaigns.push({ key, name, created: new Date().toISOString() });
    saveCampaignIndex(index);
    // Create empty campaign data
    const emptyData = {
        locations: [],
        npcs: [],
        quests: [],
        characters: [],
        sessionNotes: [],
        storyArcs: [],
        quickNotes: '',
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        loot: [],
        items: [],
        encounters: [],
        spells: [],
        links: [],
        filters: [],
        calendar: { day: 1, month: 0, year: 1492, events: [] },
        _nextId: {}
    };
    const result = StorageAPI.setJSON(key, emptyData);
    if (!result.success) {
        showToast('❌ Fehler beim Erstellen der Kampagne', 'error');
        return;
    }
    input.value = '';
    renderCampaignList();
    showToast(`Kampagne "${name}" erstellt`);
}
function switchCampaign(key) {
    const index = getCampaignIndex();
    index.active = key;
    saveCampaignIndex(index);
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
            `⚠️ "${campaignName}" LÖSCHEN?\n\nAlle Daten (${sizeKB} KB) werden gelöscht:\n- Charaktere, NPCs, Orte\n- Quests, Encounters\n- Initiative, Beute\n- Wiki, Netzwerk\n- Sessions\n\nDieser Vorgang kann NICHT rückgängig gemacht werden!`
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
window.createCampaign = createCampaign;
window.switchCampaign = switchCampaign;
window.deleteCampaign = deleteCampaign;
