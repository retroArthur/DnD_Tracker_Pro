// [SECTION:LOCATIONS_RENDER]
// ============================================================
// LOCATIONS RENDER - @master-detail @filter @orte
// ============================================================

import { $, esc, sanitizeHTML } from '@utils/basic';
import { EntityLookup, updateCounters } from '@render/helpers';

// State
let selectedLocationId: number | null = null;

// Location type icons
const LOC_ICONS: Record<string, string> = {
    'stadt': '🏰',
    'dorf': '🏘️',
    'taverne': '🍺',
    'wald': '🌲',
    'dungeon': '🕳️',
    'tempel': '⛪',
    'turm': '🗼',
    'hoehle': '🕯️',
    'ruine': '🏚️',
    'hafen': '⚓',
    'markt': '🛒',
    'schloss': '🏯',
    'default': '📍'
};

function getLocationIcon(loc: any): string {
    // Try to detect type from name or description
    const text = ((loc.name || '') + ' ' + (loc.description || '')).toLowerCase();
    if (text.includes('tavern') || text.includes('gasth') || text.includes('schenke')) return LOC_ICONS.taverne;
    if (text.includes('wald') || text.includes('forest')) return LOC_ICONS.wald;
    if (text.includes('dungeon') || text.includes('verlies')) return LOC_ICONS.dungeon;
    if (text.includes('tempel') || text.includes('kirche') || text.includes('schrein')) return LOC_ICONS.tempel;
    if (text.includes('turm') || text.includes('tower')) return LOC_ICONS.turm;
    if (text.includes('höhle') || text.includes('hoehle') || text.includes('cave')) return LOC_ICONS.hoehle;
    if (text.includes('ruine') || text.includes('ruin')) return LOC_ICONS.ruine;
    if (text.includes('hafen') || text.includes('dock') || text.includes('port')) return LOC_ICONS.hafen;
    if (text.includes('markt') || text.includes('market') || text.includes('basar')) return LOC_ICONS.markt;
    if (text.includes('schloss') || text.includes('burg') || text.includes('castle')) return LOC_ICONS.schloss;
    if (text.includes('dorf') || text.includes('village')) return LOC_ICONS.dorf;
    if (text.includes('stadt') || text.includes('city')) return LOC_ICONS.stadt;
    return LOC_ICONS.default;
}

export function renderLocations(): void {
    const D = (window as any).D;
    const currentLocFilter = (window as any).currentLocFilter || 'all';
    const stripHtml = (window as any).stripHtml;

    const listContainer = $('locations-list');
    const filterContainer = $('location-filters');
    if (!listContainer) return;

    // Update counter
    updateCounters({ 'locations-io-count': D.locations?.length || 0 });

    // Render filter chips
    if (filterContainer) {
        filterContainer.innerHTML = `
            <div class="loc-filter-chip ${currentLocFilter === 'all' ? 'active' : ''}" data-action="set-loc-filter" data-value="all">Alle</div>
            ${D.filters.map((f: any) => `
                <div class="loc-filter-chip ${currentLocFilter === f.id ? 'active' : ''}"
                     data-action="set-loc-filter" data-id="${f.id}"
                     style="${currentLocFilter === f.id ? '' : `border-color: var(--${f.color}); color: var(--${f.color})`}">
                    ${esc(f.name)}
                </div>
            `).join('')}
        `;
    }

    // Get search and filter
    const searchEl = $('loc-search') as HTMLInputElement | null;
    const search = (searchEl?.value || '').toLowerCase();
    let locs = D.locations || [];

    // Apply filter
    if (currentLocFilter !== 'all') {
        locs = locs.filter((l: any) => l.filterId === currentLocFilter);
    }

    // Apply search
    if (search) {
        const npcLocs = new Set(D.npcs.filter((n: any) => n.name.toLowerCase().includes(search)).map((n: any) => n.locationId));
        locs = locs.filter((l: any) =>
            l.name.toLowerCase().includes(search) ||
            (l.description || '').toLowerCase().includes(search) ||
            npcLocs.has(l.id)
        );
    }

    // Empty state
    if (!locs.length) {
        listContainer.innerHTML = `
            <div class="loc-empty-state">
                <div class="loc-empty-icon">🏠</div>
                <div class="loc-empty-title">${search || currentLocFilter !== 'all' ? 'Keine Treffer' : 'Keine Orte'}</div>
                <div class="loc-empty-desc">${search || currentLocFilter !== 'all' ? 'Versuche andere Suchbegriffe' : 'Erstelle deinen ersten Ort'}</div>
                ${!search && currentLocFilter === 'all' ? `
                    <button class="loc-add-btn" data-action="show-modal" data-value="location-modal" style="margin-top: 12px;">
                        + Ort erstellen
                    </button>
                ` : ''}
            </div>
        `;
        clearLocationDetail();
        return;
    }

    // Render list items
    listContainer.innerHTML = locs.map((loc: any) => renderLocationItem(loc, stripHtml)).join('');

    // Auto-select first if none selected
    if (!selectedLocationId || !locs.find((l: any) => l.id === selectedLocationId)) {
        selectLocation(locs[0].id, false);
    } else {
        // Re-render detail for current selection
        showLocationDetail(selectedLocationId);
    }
}

function renderLocationItem(loc: any, stripHtml: (html: string) => string): string {
    const D = (window as any).D;
    const npcs = D.npcs.filter((n: any) => n.locationId === loc.id);
    const filter = EntityLookup.filter(loc.filterId);
    const icon = getLocationIcon(loc);
    const isSelected = loc.id === selectedLocationId;
    const descPreview = loc.description ? stripHtml(loc.description).substring(0, 60) : '';

    // NPC avatars (max 4)
    const npcAvatars = npcs.slice(0, 4).map((n: any) => `
        <div class="loc-mini-avatar" title="${esc(n.name)}">
            ${n.avatar ? `<img src="${esc(n.avatar)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : '👤'}
        </div>
    `).join('');

    const moreNpcs = npcs.length > 4 ? `<div class="loc-mini-avatar more">+${npcs.length - 4}</div>` : '';

    return `
        <div class="loc-item ${isSelected ? 'selected' : ''}" data-action="select-location" data-id="${loc.id}">
            <div class="loc-item-icon">${icon}</div>
            <div class="loc-item-info">
                <div class="loc-item-name">
                    ${filter ? `<span class="loc-item-tag" style="background: var(--${filter.color})">${esc(filter.name)}</span>` : ''}${esc(loc.name)}
                </div>
                <div class="loc-item-meta">
                    ${descPreview ? descPreview + (loc.description && stripHtml(loc.description).length > 60 ? '...' : '') : 'Keine Beschreibung'}
                    ${npcs.length ? ` • ${npcs.length} NPC${npcs.length > 1 ? 's' : ''}` : ''}
                </div>
            </div>
            ${npcs.length ? `<div class="loc-item-npcs">${npcAvatars}${moreNpcs}</div>` : ''}
        </div>
    `;
}

export function selectLocation(id: number | string, scroll: boolean = true): void {
    selectedLocationId = typeof id === 'string' ? parseInt(id) : id;

    // Update selection in list
    document.querySelectorAll('.loc-item').forEach(el => {
        const element = el as HTMLElement;
        element.classList.toggle('selected', element.dataset.id === String(selectedLocationId));
    });

    // Show detail
    showLocationDetail(selectedLocationId);

    // Scroll into view if needed
    if (scroll) {
        const item = document.querySelector(`.loc-item[data-id="${selectedLocationId}"]`);
        if (item) {
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

export function showLocationDetail(id: number | string): void {
    const D = (window as any).D;
    const LINK_ICONS = (window as any).LINK_ICONS;

    const panel = $('loc-detail-panel');
    if (!panel) return;

    const loc = EntityLookup.location(id);
    if (!loc) {
        clearLocationDetail();
        return;
    }

    const npcs = D.npcs.filter((n: any) => n.locationId === loc.id);
    const filter = EntityLookup.filter(loc.filterId);
    const icon = getLocationIcon(loc);
    const tags = loc.tags || [];
    const links = loc.links || [];

    // Build NPC list
    const npcListHtml = npcs.length ? npcs.map((n: any) => `
        <div class="loc-npc-item" data-action="show-npc-popup" data-id="${n.id}">
            <div class="loc-npc-avatar">
                ${n.avatar ? `<img src="${esc(n.avatar)}">` : '👤'}
            </div>
            <div class="loc-npc-name">${esc(n.name)}</div>
            <div class="loc-npc-role">${esc(n.role || n.race || '—')}</div>
        </div>
    `).join('') : '<div style="color: var(--text-dim); font-size: 0.85em;">Keine NPCs an diesem Ort</div>';

    // Build links - EntityLookup methods are singular (location, npc, etc.)
    const lookupMap: Record<string, string> = {
        locations: 'location',
        npcs: 'npc',
        characters: 'character',
        quests: 'quest',
        encounters: 'encounter',
        spells: 'spell',
        loot: 'lootItem',
        wiki: 'wiki'
    };

    const linksHtml = links.length ? links.map((link: any) => {
        const lookupFn = lookupMap[link.type];
        const target = lookupFn && (EntityLookup as any)[lookupFn] ? (EntityLookup as any)[lookupFn](link.id) : null;
        if (!target) return '';

        // NPC-Links als Chips mit show-npc-popup für Konsistenz
        if (link.type === 'npcs') {
            return `<span class="loc-npc-chip" data-action="show-npc-popup" data-id="${link.id}">${target.avatar ? `<img src="${esc(target.avatar)}" class="loc-npc-chip-avatar">` : ''}${esc(target.name)}</span>`;
        }

        // Alle anderen Links normal (LINK_ICONS aus core/constants.js)
        return `<span class="loc-link" data-action="navigate-entity" data-type="${link.type}" data-id="${link.id}">${LINK_ICONS[link.type] || '🔗'} ${esc(target.name || target.title)}</span>`;
    }).filter(Boolean).join('') : '';

    // Build tags - Tags sind Objekte mit {name, color}
    const tagsHtml = tags.length ? tags.map((t: any) => `<span class="loc-tag tag-${t.color || 'blue'}">${esc(t.name || t)}</span>`).join('') : '';

    panel.innerHTML = `
        <div class="loc-detail-content">
            <div class="loc-detail-header">
                <div class="loc-detail-icon">${icon}</div>
                <div class="loc-detail-title">
                    <div class="loc-detail-name">${esc(loc.name)}</div>
                    <div class="loc-detail-region">
                        ${filter ? `<span style="color: var(--${filter.color})">● ${esc(filter.name)}</span>` : '📍 Ort'}
                    </div>
                </div>
                <div class="loc-detail-actions">
                    <button class="loc-detail-btn" data-action="show-entity-links-modal" data-type="locations" data-id="${loc.id}" title="Verknüpfungen">🔗</button>
                    <button class="loc-detail-btn" data-action="show-tags-modal" data-type="locations" data-id="${loc.id}" title="Tags">🏷️</button>
                    <button class="loc-detail-btn" data-action="edit-location" data-id="${loc.id}" title="Bearbeiten">✏️</button>
                    <button class="loc-detail-btn danger" data-action="delete-location" data-id="${loc.id}" title="Löschen">🗑️</button>
                </div>
            </div>

            ${(tagsHtml || linksHtml || npcs.length) ? `
                <div class="loc-info-bar">
                    ${tagsHtml ? `<div class="loc-tags">${tagsHtml}</div>` : ''}
                    ${linksHtml ? `<div class="loc-links">${linksHtml}</div>` : ''}
                    ${npcs.length ? `<div class="loc-npcs-inline">
                        <span style="color: var(--text-dim); font-size: 0.85em;">👥 NPCs:</span>
                        ${npcs.slice(0, 5).map((n: any) => `<span class="loc-npc-chip" data-action="show-npc-popup" data-id="${n.id}">${n.avatar ? `<img src="${esc(n.avatar)}" class="loc-npc-chip-avatar">` : ''}${esc(n.name)}</span>`).join('')}
                        ${npcs.length > 5 ? `<span class="loc-npc-chip more">+${npcs.length - 5}</span>` : ''}
                    </div>` : ''}
                </div>
            ` : ''}

            <div class="loc-section">
                <div class="loc-section-title">Beschreibung</div>
                <div class="loc-desc">
                    ${loc.description ? sanitizeHTML(loc.description) : '<span style="color: var(--text-dim);">Keine Beschreibung vorhanden</span>'}
                </div>
            </div>
        </div>
    `;
}

export function clearLocationDetail(): void {
    const panel = $('loc-detail-panel');
    if (panel) {
        panel.innerHTML = `
            <div class="loc-detail-empty">
                <div class="loc-detail-empty-icon">🏠</div>
                <div class="loc-detail-empty-text">Wähle einen Ort aus der Liste</div>
            </div>
        `;
    }
}

export function setLocFilter(f: any): void {
    (window as any).currentLocFilter = f;
    selectedLocationId = null; // Reset selection on filter change
    renderLocations();
}

export function toggleLocation(id: number | string): void {
    // For search navigation: select and show the location
    const loc = EntityLookup.location(id);
    if (!loc) return;

    // Reset filter to show all
    (window as any).currentLocFilter = 'all';
    selectedLocationId = typeof id === 'string' ? parseInt(id) : id;
    renderLocations();

    // Highlight briefly
    setTimeout(() => {
        const item = document.querySelector(`.loc-item[data-id="${selectedLocationId}"]`) as HTMLElement | null;
        if (item) {
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            item.style.transition = 'box-shadow 0.3s ease';
            item.style.boxShadow = '0 0 20px var(--gold)';
            setTimeout(() => {
                item.style.boxShadow = '';
            }, 2000);
        }
    }, 100);
}

// ============================================================
// LEGACY FUNCTIONS - Kept for backwards compatibility
// ============================================================

export function renderFilterList(): void {
    const D = (window as any).D;
    const c = $('filter-list');
    if (!c) return;
    c.innerHTML = D.filters.map((f: any) => `<div class="chip color-${f.color}" style="margin:3px;">${esc(f.name)} <button data-action="delete-filter" data-id="${f.id}" style="background:none;border:none;color:inherit;cursor:pointer;">✕</button></div>`).join('');
}

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================

(window as any).selectedLocationId = selectedLocationId;
(window as any).renderLocations = renderLocations;
(window as any).selectLocation = selectLocation;
(window as any).showLocationDetail = showLocationDetail;
(window as any).clearLocationDetail = clearLocationDetail;
(window as any).setLocFilter = setLocFilter;
(window as any).toggleLocation = toggleLocation;
(window as any).renderFilterList = renderFilterList;
