// [SECTION:CAMPAIGN_MANAGER]
// Extrahiert aus dice.js
// Kampagnen-Verwaltung
// Zeilen: 163

import { $, esc } from '@utils/basic';
import { showToast } from '@utils/utilities';
import { formatDate } from '@utils/utilities';

// ============================================================
// TYPES
// ============================================================

interface Campaign {
    key: string;
    name: string;
    created: string;
}

interface CampaignIndex {
    campaigns: Campaign[];
    active: string;
}

interface EmptyData {
    locations: any[];
    npcs: any[];
    quests: any[];
    characters: any[];
    sessionNotes: any[];
    storyArcs: any[];
    quickNotes: string;
    initiative: {
        combatants: any[];
        currentTurn: number;
        round: number;
    };
    loot: any[];
    items: any[];
    encounters: any[];
    spells: any[];
    links: any[];
    filters: any[];
    mindmap: {
        nodes: any[];
        connections: any[];
    };
    calendar: {
        day: number;
        month: number;
        year: number;
        events: any[];
    };
    _nextId: Record<string, number>;
}

// ============================================================
// CAMPAIGN MANAGER
// ============================================================

// Alias für Rückwärtskompatibilität
const APP_CONFIG = (window as any).APP_CONFIG;
const StorageAPI = (window as any).StorageAPI;
const log = (window as any).log;
const idb = (window as any).idb;
const initIndexedDB = (window as any).initIndexedDB;

const CAMPAIGN_INDEX_KEY: string = APP_CONFIG.CAMPAIGN_INDEX_KEY;

export function getCampaignIndex(): CampaignIndex {
    return StorageAPI.getJSON(CAMPAIGN_INDEX_KEY, { campaigns: [], active: APP_CONFIG.STORAGE_KEY });
}

function saveCampaignIndex(index: CampaignIndex): void {
    StorageAPI.setJSON(CAMPAIGN_INDEX_KEY, index);
}

export function createCampaign(): void {
    const input = $('new-campaign-name') as HTMLInputElement | null;
    if (!input) return;

    const name = input.value.trim();
    if (!name) { showToast('⚠️ Name erforderlich', 'error'); return; }

    const index = getCampaignIndex();
    const key = 'dnd-campaign-' + Date.now();

    index.campaigns.push({ key, name, created: new Date().toISOString() });
    saveCampaignIndex(index);

    // Create empty campaign data
    const emptyData: EmptyData = {
        locations: [], npcs: [], quests: [], characters: [], sessionNotes: [], storyArcs: [], quickNotes: '',
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        loot: [], items: [], encounters: [], spells: [], links: [],
        filters: [], mindmap: { nodes: [], connections: [] },
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

export function switchCampaign(key: string): void {
    const index = getCampaignIndex();
    index.active = key;
    saveCampaignIndex(index);
    location.reload();
}

export async function deleteCampaign(): Promise<void> {
    const index = getCampaignIndex();
    const isDefault = index.active === APP_CONFIG.STORAGE_KEY;
    const key = isDefault ? APP_CONFIG.STORAGE_KEY : index.active;

    // Datengröße ermitteln
    const dataSize = localStorage.getItem(key);
    const sizeKB = dataSize ? (dataSize.length / 1024).toFixed(1) : 0;

    const campaignName = isDefault ? 'Standard-Kampagne' : (index.campaigns.find(c => c.key === key)?.name || 'Unbekannt');

    if (!confirm(`⚠️ "${campaignName}" LÖSCHEN?\n\nAlle Daten (${sizeKB} KB) werden gelöscht:\n- Charaktere, NPCs, Orte\n- Quests, Encounters\n- Initiative, Beute\n- Wiki, Netzwerk\n- Sessions\n\nDieser Vorgang kann NICHT rückgängig gemacht werden!`)) {
        return;
    }

    try {
        log('[deleteCampaign] Lösche Kampagne:', key);

        // 1. LocalStorage löschen
        localStorage.removeItem(key);
        log('[deleteCampaign] LocalStorage gelöscht');

        // 2. IndexedDB Eintrag löschen (nicht die ganze DB!)
        if (window.indexedDB) {
            try {
                // Initialisiere IDB falls nötig
                const idbInstance = (window as any).idb;
                if (!idbInstance) await initIndexedDB();

                // Lösche den spezifischen Eintrag aus dem campaigns Store
                await new Promise<void>((resolve, reject) => {
                    const transaction = ((window as any).idb as IDBDatabase).transaction(['campaigns'], 'readwrite');
                    const store = transaction.objectStore('campaigns');
                    const request = store.delete(key);

                    request.onsuccess = () => {
                        log('[deleteCampaign] IndexedDB Eintrag gelöscht');
                        resolve();
                    };
                    request.onerror = () => {
                        console.warn('[deleteCampaign] IndexedDB Löschung fehlgeschlagen:', request.error);
                        resolve(); // Trotzdem weitermachen
                    };
                });
            } catch (idbError) {
                console.warn('[deleteCampaign] IndexedDB Fehler:', idbError);
            }
        }

        // 3. Wenn nicht Standard-Kampagne, aus Index entfernen
        if (!isDefault) {
            index.campaigns = index.campaigns.filter(c => c.key !== key);
            index.active = APP_CONFIG.STORAGE_KEY;
            saveCampaignIndex(index);
        }

        // 4. Globales D-Objekt zurücksetzen (falls Seite nicht neu lädt)
        // D is const, cannot reassign - clear and recreate structure
        const D = (window as any).D;
        for (const key in D) delete D[key];
        Object.assign(D, {
            locations: [], npcs: [], quests: [], characters: [], sessionNotes: [], storyArcs: [], quickNotes: '',
            initiative: { combatants: [], currentTurn: 0, round: 1 },
            loot: [], items: [], encounters: [], spells: [], links: [], wiki: [],
            filters: [], mindmap: { nodes: [], connections: [] },
            calendar: { day: 1, month: 0, year: 1492, events: [] },
            tags: [],
            settings: { theme: 'dark', lastView: 'dashboard' },
            _nextId: {}
        });

        alert(`✅ "${campaignName}" wurde gelöscht!\n\nDie Seite wird neu geladen...`);

        // 5. Seite mit Cache-Bypass neu laden
        window.location.href = window.location.pathname + '?cleared=' + Date.now();

    } catch (error: any) {
        console.error('[deleteCampaign] Fehler:', error);
        alert('❌ Fehler beim Löschen:\n\n' + error.message);
    }
}

export function renderCampaignList(): void {
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

(window as any).getCampaignIndex = getCampaignIndex;
(window as any).createCampaign = createCampaign;
(window as any).switchCampaign = switchCampaign;
(window as any).deleteCampaign = deleteCampaign;
(window as any).renderCampaignList = renderCampaignList;
