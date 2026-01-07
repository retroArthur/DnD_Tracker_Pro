// [SECTION:NPC_RENDER]
// ============================================================
// NPC RENDER - @master-detail @filter @icons
// ============================================================

import { $, esc, sanitizeHTML } from '@utils/basic';
import { showToast } from '@utils/utilities';
import { save } from '@systems/spellslots/persistence';
import { showModal, hideModal } from '@systems/spellslots/navigation';
import { EntityLookup, updateCounters } from '@render/helpers';
import { pushUndo } from '@systems/undo';

// State
let selectedNpcId: number | null = null;
let currentNpcFilter: number | string = 'all';
let currentRelationStatus: string = 'neutral';

// NPC type icons based on race
const NPC_ICONS: Record<string, string> = {
    'mensch': '👤',
    'human': '👤',
    'elf': '🧝',
    'zwerg': '⛏️',
    'dwarf': '⛏️',
    'halbling': '🍀',
    'halfling': '🍀',
    'ork': '👹',
    'orc': '👹',
    'goblin': '👺',
    'drache': '🐉',
    'dragon': '🐉',
    'untot': '💀',
    'undead': '💀',
    'dämon': '😈',
    'demon': '😈',
    'tiefling': '😈',
    'gnom': '🎩',
    'gnome': '🎩',
    'default': '🎭'
};

// Relation status definitions
interface RelationStatusDef {
    label: string;
    icon: string;
    color: string;
}

const RELATION_STATUS: Record<string, RelationStatusDef> = {
    friendly: { label: 'Freundlich', icon: '🟢', color: 'var(--green)' },
    neutral: { label: 'Neutral', icon: '⚪', color: 'var(--text)' },
    hostile: { label: 'Feindlich', icon: '🔴', color: 'var(--red)' }
};

/**
 * Gets the appropriate icon for an NPC based on race
 */
function getNPCIcon(npc: any): string {
    const race = (npc.race || '').toLowerCase();
    for (const [key, icon] of Object.entries(NPC_ICONS)) {
        if (race.includes(key)) return icon;
    }
    return NPC_ICONS.default;
}

/**
 * Renders the NPC list in master-detail layout
 * Considers active filters and search terms
 */
export function renderNPCList(): void {
    const D = (window as any).D;
    const listContainer = $('npc-list');
    const filterContainer = $('npc-filters');
    if (!listContainer) return;

    // Update counter
    updateCounters({ 'npcs-io-count': D.npcs?.length || 0 });

    // Render filter chips (by location)
    if (filterContainer) {
        const locations = D.locations || [];
        filterContainer.innerHTML = `
            <div class="npc-filter-chip ${currentNpcFilter === 'all' ? 'active' : ''}" data-action="set-npc-filter" data-value="all">Alle</div>
            ${locations.slice(0, 5).map((loc: any) => `
                <div class="npc-filter-chip ${currentNpcFilter === loc.id ? 'active' : ''}"
                     data-action="set-npc-filter" data-id="${loc.id}">
                    ${esc(loc.name)}
                </div>
            `).join('')}
            ${locations.length > 5 ? `
                <select class="npc-filter-select" data-on-change="setNpcFilter">
                    <option value="">Mehr...</option>
                    ${locations.slice(5).map((loc: any) => `<option value="${loc.id}">${esc(loc.name)}</option>`).join('')}
                </select>
            ` : ''}
        `;
    }

    // Get search and filter
    const searchEl = $('npc-search') as HTMLInputElement | null;
    const search = (searchEl?.value || '').toLowerCase();
    let npcs = [...(D.npcs || [])];

    // Apply location filter
    if (currentNpcFilter !== 'all') {
        npcs = npcs.filter((n: any) => n.locationId === currentNpcFilter);
    }

    // Apply search
    if (search) {
        npcs = npcs.filter((n: any) =>
            n.name.toLowerCase().includes(search) ||
            (n.role || '').toLowerCase().includes(search) ||
            (n.race || '').toLowerCase().includes(search) ||
            (n.description || '').toLowerCase().includes(search) ||
            (n.dialogs || []).some((d: any) => (d.text || '').toLowerCase().includes(search))
        );
    }

    // Sort alphabetically
    npcs.sort((a: any, b: any) => a.name.localeCompare(b.name));

    // Empty state
    if (!npcs.length) {
        listContainer.innerHTML = `
            <div class="npc-empty-state">
                <div class="npc-empty-icon">🎭</div>
                <div class="npc-empty-title">${search || currentNpcFilter !== 'all' ? 'Keine Treffer' : 'Keine NPCs'}</div>
                <div class="npc-empty-desc">${search || currentNpcFilter !== 'all' ? 'Versuche andere Suchbegriffe' : 'Erstelle deinen ersten NPC'}</div>
                ${!search && currentNpcFilter === 'all' ? `
                    <button class="npc-add-btn" data-action="show-modal" data-value="npc-modal" style="margin-top: 12px;">
                        + NPC erstellen
                    </button>
                ` : ''}
            </div>
        `;
        clearNPCDetail();
        return;
    }

    // Render list items
    listContainer.innerHTML = npcs.map((npc: any) => renderNPCItem(npc)).join('');

    // Auto-select first if none selected
    if (!selectedNpcId || !npcs.find((n: any) => n.id === selectedNpcId)) {
        selectNPC(npcs[0].id, false);
    } else {
        showNPCDetail(selectedNpcId);
    }

    // Update stats
    updateNPCStats();
}

function renderNPCItem(npc: any): string {
    const location = EntityLookup.location(npc.locationId);
    const icon = getNPCIcon(npc);
    const isSelected = npc.id === selectedNpcId;
    const dialogCount = (npc.dialogs || []).length;
    const triggerCount = (npc.triggers || []).length;

    return `
        <div class="npc-item ${isSelected ? 'selected' : ''}" data-action="select-npc" data-id="${npc.id}">
            <div class="npc-item-avatar">
                ${npc.avatar ? `<img src="${esc(npc.avatar)}" alt="">` : icon}
            </div>
            <div class="npc-item-info">
                <div class="npc-item-name">
                    ${esc(npc.name)}
                    ${location ? `<span class="npc-item-tag">${esc(location.name)}</span>` : ''}
                </div>
                <div class="npc-item-meta">
                    ${npc.race ? `<span class="npc-item-race">${esc(npc.race)}</span>` : ''}
                    ${npc.race && npc.role ? ' • ' : ''}
                    ${npc.role ? esc(npc.role) : ''}
                </div>
            </div>
            <div class="npc-item-badges">
                ${dialogCount ? `<span class="npc-badge dialog" title="${dialogCount} Dialoge">💬 ${dialogCount}</span>` : ''}
                ${triggerCount ? `<span class="npc-badge trigger" title="${triggerCount} Trigger">🔔 ${triggerCount}</span>` : ''}
            </div>
        </div>
    `;
}

export function selectNPC(id: number | string, scroll: boolean = true): void {
    selectedNpcId = typeof id === 'string' ? parseInt(id) : id;

    // Update selection in list
    document.querySelectorAll('.npc-item').forEach(el => {
        const element = el as HTMLElement;
        element.classList.toggle('selected', element.dataset.id === String(selectedNpcId));
    });

    // Show detail
    showNPCDetail(selectedNpcId);

    // Scroll into view if needed
    if (scroll) {
        const item = document.querySelector(`.npc-item[data-id="${selectedNpcId}"]`);
        if (item) {
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

/**
 * Shows the detail view of an NPC in the right panel
 */
export function showNPCDetail(id: number | string): void {
    const LINK_ICONS = (window as any).LINK_ICONS;
    const stripHtml = (window as any).stripHtml;
    const panel = $('npc-detail-panel');
    if (!panel) return;

    const npc = EntityLookup.npc(id);
    if (!npc) {
        clearNPCDetail();
        return;
    }

    const location = EntityLookup.location(npc.locationId);
    const icon = getNPCIcon(npc);
    const dialogs = npc.dialogs || [];
    const triggers = npc.triggers || [];
    const usedDialogs = dialogs.filter((d: any) => d.used).length;
    const tags = npc.tags || [];
    const links = npc.links || [];

    // Build dialogs list
    const dialogsHtml = dialogs.length ? dialogs.map((d: any, idx: number) => `
        <div class="npc-dialog-item ${d.used ? 'used' : ''}">
            <div class="npc-dialog-marker ${d.used ? 'used' : ''}">${idx + 1}</div>
            <div class="npc-dialog-content">
                <div class="npc-dialog-title">${esc(d.title || d.situation || 'Dialog ' + (idx + 1))}</div>
                <div class="npc-dialog-text">"${esc(stripHtml(d.text || '').substring(0, 100))}${(d.text || '').length > 100 ? '...' : ''}"</div>
            </div>
            <div class="npc-dialog-actions">
                <button class="npc-detail-btn small ${d.used ? '' : 'success'}"
                        data-action="toggle-npc-dialog-stop" data-id="${npc.id}" data-value="${idx}"
                        title="${d.used ? 'Als unbenutzt markieren' : 'Als verwendet markieren'}">
                    ${d.used ? '↩️' : '✓'}
                </button>
                <button class="npc-detail-btn small" data-action="copy-dialog-text-stop" data-id="${npc.id}" data-value="${idx}" title="Kopieren">📋</button>
            </div>
        </div>
    `).join('') : '<div class="npc-detail-empty-text">Keine Dialoge vorhanden</div>';

    // Build triggers list
    const triggersHtml = triggers.length ? triggers.map((t: any, idx: number) => `
        <div class="npc-trigger-item ${t.triggered ? 'triggered' : ''}">
            <div class="npc-trigger-check ${t.triggered ? 'triggered' : ''}"
                 data-action="toggle-npc-trigger-stop" data-id="${npc.id}" data-value="${idx}">
                ${t.triggered ? '✓' : ''}
            </div>
            <div class="npc-trigger-content">
                <div class="npc-trigger-condition">${esc(t.condition)}</div>
                ${t.triggered ? `<div class="npc-trigger-reveal">${esc(t.reveal)}</div>` : ''}
            </div>
        </div>
    `).join('') : '<div class="npc-detail-empty-text">Keine Trigger vorhanden</div>';

    // Build tags
    const tagsHtml = tags.length ? tags.map((t: string) => `<span class="npc-tag">${esc(t)}</span>`).join('') : '';

    // Build links (LINK_ICONS from core/constants.js)
    const linksHtml = links.length ? links.map((link: any) => {
        const target = EntityLookup.get(link.type, link.id);
        if (!target) return '';
        return `<span class="npc-link" data-action="navigate-entity" data-type="${link.type}" data-id="${link.id}">${LINK_ICONS[link.type] || '🔗'} ${esc(target.name)}</span>`;
    }).join('') : '';

    panel.innerHTML = `
        <div class="npc-detail-content">
            <div class="npc-detail-header">
                <div class="npc-detail-avatar">
                    ${npc.avatar ? `<img src="${esc(npc.avatar)}" alt="">` : icon}
                </div>
                <div class="npc-detail-title">
                    <div class="npc-detail-name">${esc(npc.name)}</div>
                    <div class="npc-detail-subtitle">
                        ${npc.race ? `<span class="npc-detail-race">${esc(npc.race)}</span>` : ''}
                        ${npc.race && npc.role ? ' • ' : ''}
                        ${npc.role ? `<span class="npc-detail-role">${esc(npc.role)}</span>` : ''}
                    </div>
                    ${location ? `<div class="npc-detail-location">📍 ${esc(location.name)}</div>` : ''}
                </div>
                <div class="npc-detail-actions">
                    <button class="npc-detail-btn" data-action="show-avatar-modal" data-type="npcs" data-id="${npc.id}" title="Bild">🖼️</button>
                    <button class="npc-detail-btn" data-action="show-relations-modal-stop" data-id="${npc.id}" title="Beziehungen">🤝</button>
                    <button class="npc-detail-btn" data-action="show-entity-links-modal" data-type="npcs" data-id="${npc.id}" title="Verknüpfungen">🔗</button>
                    <button class="npc-detail-btn" data-action="show-tags-modal" data-type="npcs" data-id="${npc.id}" title="Tags">🏷️</button>
                    <button class="npc-detail-btn" data-action="edit-npc" data-id="${npc.id}" title="Bearbeiten">✏️</button>
                    <button class="npc-detail-btn danger" data-action="delete-npc" data-id="${npc.id}" title="Löschen">🗑️</button>
                </div>
            </div>

            ${npc.description ? `
                <div class="npc-section">
                    <div class="npc-section-title">Beschreibung</div>
                    <div class="npc-desc">${sanitizeHTML(npc.description)}</div>
                </div>
            ` : ''}

            ${tagsHtml ? `
                <div class="npc-section">
                    <div class="npc-section-title">Tags</div>
                    <div class="npc-tags">${tagsHtml}</div>
                </div>
            ` : ''}

            <div class="npc-section">
                <div class="npc-section-title">
                    Beziehungen (${(npc.relations || []).length})
                    <button class="npc-section-btn" data-action="show-relations-modal-stop" data-id="${npc.id}" title="Beziehung hinzufügen">+</button>
                </div>
                ${renderNPCRelations(npc)}
            </div>

            <div class="npc-section">
                <div class="npc-section-title">
                    Dialoge (${usedDialogs}/${dialogs.length} verwendet)
                    <button class="npc-section-btn" data-action="show-add-dialog-modal-stop" data-id="${npc.id}" title="Dialog hinzufügen">+</button>
                </div>
                <div class="npc-dialog-list">${dialogsHtml}</div>
            </div>

            <div class="npc-section">
                <div class="npc-section-title">Trigger (${triggers.length})</div>
                <div class="npc-trigger-list">${triggersHtml}</div>
            </div>

            ${linksHtml ? `
                <div class="npc-section">
                    <div class="npc-section-title">Verknüpfungen</div>
                    <div class="npc-links">${linksHtml}</div>
                </div>
            ` : ''}
        </div>
    `;
}

export function clearNPCDetail(): void {
    const panel = $('npc-detail-panel');
    if (panel) {
        panel.innerHTML = `
            <div class="npc-detail-empty">
                <div class="npc-detail-empty-icon">🎭</div>
                <div class="npc-detail-empty-text">Wähle einen NPC aus der Liste</div>
            </div>
        `;
    }
}

export function setNpcFilter(f: any): void {
    // Supports both direct values and element (from data-on-change)
    if (f && f.tagName) {
        // Element passed - extract value
        const val = (f as HTMLSelectElement).value;
        f = val ? parseInt(val, 10) : 'all';
    }
    currentNpcFilter = f;
    selectedNpcId = null;
    renderNPCList();
}

export function toggleNPC(id: number | string): void {
    // For search navigation: select and show the NPC
    const npc = EntityLookup.npc(id);
    if (!npc) return;

    currentNpcFilter = 'all';
    selectedNpcId = typeof id === 'string' ? parseInt(id) : id;
    renderNPCList();

    setTimeout(() => {
        const item = document.querySelector(`.npc-item[data-id="${selectedNpcId}"]`) as HTMLElement | null;
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

// Helper functions
function renderNPCTags(n: any): { questTags: string; relationTags: string; infoTags: string } {
    const D = (window as any).D;

    const questTags = (n.quests || []).map((q: string) => {
        const quest = (D.quests || []).find((qst: any) => qst.name && qst.name.toLowerCase() === q.toLowerCase());
        if (quest) {
            return `<span class="npc-list-tag quest clickable" data-action="navigate-entity-stop" data-type="quests" data-id="${quest.id}">📜 ${esc(q)}</span>`;
        }
        return `<span class="npc-list-tag quest">📜 ${esc(q)}</span>`;
    }).join('');

    const relationTags = (n.relationships || []).map((r: string) => {
        const npc = (D.npcs || []).find((np: any) => np.name && np.name.toLowerCase() === r.toLowerCase());
        const char = (D.characters || []).find((c: any) => c.name && c.name.toLowerCase() === r.toLowerCase());
        if (npc) {
            return `<span class="npc-list-tag relation clickable" data-action="navigate-entity-stop" data-type="npcs" data-id="${npc.id}">👥 ${esc(r)}</span>`;
        } else if (char) {
            return `<span class="npc-list-tag relation clickable" data-action="navigate-entity-stop" data-type="characters" data-id="${char.id}">👥 ${esc(r)}</span>`;
        }
        return `<span class="npc-list-tag relation">👥 ${esc(r)}</span>`;
    }).join('');

    const infoTags = (n.info || []).map((i: string) => `<span class="npc-list-tag info">ℹ️ ${esc(i)}</span>`).join('');

    return { questTags, relationTags, infoTags };
}

function updateNPCStats(): void {
    const D = (window as any).D;
    if (!D.npcs) return;
    const totalDialogs = D.npcs.reduce((sum: number, n: any) => sum + (n.dialogs?.length || 0), 0);
    const totalTriggers = D.npcs.reduce((sum: number, n: any) => sum + (n.triggers?.length || 0), 0);
    updateCounters({
        'npc-stats-total': D.npcs.length,
        'npc-stats-dialogs': totalDialogs,
        'npc-stats-triggers': totalTriggers
    });
}

// Legacy compatibility functions
export function toggleNPCCard(id: number | string): void {
    selectNPC(id);
}

export function expandAllNPCCards(): void {
    showToast('Alle NPCs werden in der Liste angezeigt');
}

export function collapseAllNPCCards(): void {
    selectedNpcId = null;
    clearNPCDetail();
    showToast('Details-Panel geleert');
}

export function expandAllNPCDialogs(): void {
    showToast('Dialoge werden im Detail-Panel angezeigt');
}

export function collapseAllNPCDialogs(): void {
    showToast('Wähle einen NPC für Details');
}

// ============================================================
// NPC RELATIONS SYSTEM
// ============================================================

function renderNPCRelations(npc: any): string {
    const relations = npc.relations || [];

    if (!relations.length) {
        return '<div class="npc-detail-empty-text">Keine Beziehungen definiert</div>';
    }

    return `
        <div class="npc-relations-list">
            ${relations.map((rel: any, idx: number) => {
                let targetName: string, icon: string, typeLabel: string, isClickable = true;

                if (rel.targetType === 'party') {
                    targetName = 'Die Gruppe';
                    icon = '👥';
                    typeLabel = 'Heldengruppe';
                    isClickable = false; // Party is not a single entity to navigate to
                } else if (rel.targetType === 'characters') {
                    const target = EntityLookup.character(rel.targetId);
                    if (!target) return '';
                    targetName = target.name;
                    icon = '👤';
                    typeLabel = 'Spielercharakter';
                } else {
                    const target = EntityLookup.npc(rel.targetId);
                    if (!target) return '';
                    targetName = target.name;
                    icon = '🎭';
                    typeLabel = 'NPC';
                }

                const status = RELATION_STATUS[rel.status] || RELATION_STATUS.neutral;

                return `
                    <div class="npc-relation-item">
                        <span class="npc-relation-icon">${icon}</span>
                        <div class="npc-relation-info">
                            <div class="npc-relation-name"
                                 ${isClickable ? `data-action="navigate-entity-stop" data-type="${rel.targetType}" data-id="${rel.targetId}"` : ''}>
                                ${esc(targetName)}
                            </div>
                            <div class="npc-relation-type">
                                ${typeLabel}
                                ${rel.note ? ` • ${esc(rel.note)}` : ''}
                            </div>
                        </div>
                        <div class="npc-relation-bar">
                            <div class="npc-relation-fill ${rel.status}"></div>
                        </div>
                        <span class="npc-relation-status ${rel.status}">${status.label}</span>
                        <div class="npc-relation-actions">
                            <button class="npc-relation-btn" data-action="cycle-relation-status-stop" data-id="${npc.id}" data-value="${idx}" title="Status ändern">🔄</button>
                            <button class="npc-relation-btn danger" data-action="remove-relation-stop" data-id="${npc.id}" data-value="${idx}" title="Entfernen">✕</button>
                        </div>
                    </div>
                `;
            }).filter(Boolean).join('')}
        </div>
    `;
}

export function showRelationsModal(npcId: number | string): void {
    const D = (window as any).D;
    const npc = EntityLookup.npc(npcId);
    if (!npc) return;

    // Build options for Party, NPCs and Characters
    const partyOption = D.characters?.length > 0
        ? `<option value="party:0">👥 Die Gruppe (alle Charaktere)</option>`
        : '';

    const npcOptions = (D.npcs || [])
        .filter((n: any) => n.id !== npc.id) // Exclude self
        .map((n: any) => `<option value="npcs:${n.id}">${esc(n.name)} (NPC)</option>`)
        .join('');

    const charOptions = (D.characters || [])
        .map((c: any) => `<option value="characters:${c.id}">${esc(c.name)} (Charakter)</option>`)
        .join('');

    const existingRelations = (npc.relations || []).map((rel: any, idx: number) => {
        let targetName: string, targetIcon: string;

        if (rel.targetType === 'party') {
            targetName = 'Die Gruppe';
            targetIcon = '👥';
        } else if (rel.targetType === 'characters') {
            const target = EntityLookup.character(rel.targetId);
            if (!target) return '';
            targetName = target.name;
            targetIcon = '👤';
        } else {
            const target = EntityLookup.npc(rel.targetId);
            if (!target) return '';
            targetName = target.name;
            targetIcon = '🎭';
        }

        const status = RELATION_STATUS[rel.status] || RELATION_STATUS.neutral;
        return `
            <div class="npc-relation-item">
                <span class="npc-relation-icon">${targetIcon}</span>
                <div class="npc-relation-info">
                    <div class="npc-relation-name">${esc(targetName)}</div>
                </div>
                <span class="npc-relation-status ${rel.status}">${status.label}</span>
                <button class="npc-relation-btn danger" data-action="remove-relation-modal" data-id="${npcId}" data-value="${idx}">✕</button>
            </div>
        `;
    }).filter(Boolean).join('');

    const content = `
        <div class="relations-modal-content">
            <div class="relations-modal-header">
                <h3>🤝 Beziehungen verwalten</h3>
                <button class="btn btn-sm" data-action="hide-modal" data-value="relations-modal">✕</button>
            </div>
            <p style="color: var(--text-dim); margin-bottom: 16px;">NPC: <strong>${esc(npc.name)}</strong></p>

            <div class="relations-form">
                <div class="relations-form-row">
                    <select id="relation-target">
                        <option value="">— Ziel wählen —</option>
                        ${partyOption}
                        <optgroup label="NPCs">${npcOptions}</optgroup>
                        <optgroup label="Charaktere">${charOptions}</optgroup>
                    </select>
                </div>
                <div class="relations-form-row">
                    <div class="relations-status-btns">
                        <button class="relations-status-btn friendly" data-action="set-relation-status" data-value="friendly" id="rel-btn-friendly">🟢 Freundlich</button>
                        <button class="relations-status-btn neutral active" data-action="set-relation-status" data-value="neutral" id="rel-btn-neutral">⚪ Neutral</button>
                        <button class="relations-status-btn hostile" data-action="set-relation-status" data-value="hostile" id="rel-btn-hostile">🔴 Feindlich</button>
                    </div>
                </div>
                <div class="relations-form-row">
                    <input type="text" id="relation-note" placeholder="Notiz (optional)...">
                </div>
                <div class="relations-form-row">
                    <button class="relations-add-btn" data-action="add-relation" data-id="${npcId}">+ Beziehung hinzufügen</button>
                </div>
            </div>

            ${existingRelations ? `
                <div class="relations-existing">
                    <div class="relations-existing-title">Bestehende Beziehungen:</div>
                    <div class="npc-relations-list">${existingRelations}</div>
                </div>
            ` : ''}
        </div>
    `;

    // Create or reuse modal
    let modal = $('relations-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'relations-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal" style="max-width: 500px;">${content}</div>`;
        modal.onclick = (e) => { if (e.target === modal) hideModal('relations-modal'); };
        document.body.appendChild(modal);
    } else {
        const modalContent = modal.querySelector('.modal');
        if (modalContent) modalContent.innerHTML = content;
    }

    // Store current status
    (modal as HTMLElement).dataset.currentStatus = 'neutral';

    showModal('relations-modal');
}

export function setRelationStatus(status: string): void {
    currentRelationStatus = status;
    document.querySelectorAll('.relations-status-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === `rel-btn-${status}`);
    });
}

export function addRelation(npcId: number | string): void {
    const npc = EntityLookup.npc(npcId);
    if (!npc) return;

    const targetEl = $('relation-target') as HTMLSelectElement | null;
    const targetVal = targetEl?.value;
    if (!targetVal) {
        showToast('Bitte ein Ziel wählen', 'error');
        return;
    }

    const [targetType, targetIdStr] = targetVal.split(':');
    const targetId = parseInt(targetIdStr);

    // Check if relation already exists
    if (!npc.relations) npc.relations = [];
    if (npc.relations.some((r: any) => r.targetType === targetType && r.targetId === targetId)) {
        showToast('Beziehung existiert bereits', 'warning');
        return;
    }

    pushUndo('Beziehung hinzufügen');
    const noteEl = $('relation-note') as HTMLInputElement | null;
    const note = noteEl?.value?.trim() || '';

    npc.relations.push({
        targetId,
        targetType,
        status: currentRelationStatus,
        note
    });

    hideModal('relations-modal');
    showNPCDetail(npcId);
    save();
    showToast('Beziehung hinzugefügt');
}

export function removeRelation(npcId: number | string, index: number | string): void {
    const npc = EntityLookup.npc(npcId);
    if (!npc || !npc.relations) return;

    const idx = typeof index === 'string' ? parseInt(index) : index;

    pushUndo('Beziehung entfernen');
    npc.relations.splice(idx, 1);
    showNPCDetail(npcId);
    showRelationsModal(npcId); // Refresh modal
    save();
    showToast('Beziehung entfernt');
}

export function cycleRelationStatus(npcId: number | string, index: number | string): void {
    const npc = EntityLookup.npc(npcId);
    if (!npc || !npc.relations) return;

    const idx = typeof index === 'string' ? parseInt(index) : index;
    if (!npc.relations[idx]) return;

    pushUndo('Beziehungsstatus ändern');
    const statusOrder = ['friendly', 'neutral', 'hostile'];
    const currentIdx = statusOrder.indexOf(npc.relations[idx].status);
    npc.relations[idx].status = statusOrder[(currentIdx + 1) % 3];

    showNPCDetail(npcId);
    save();
}

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================

(window as any).selectedNpcId = selectedNpcId;
(window as any).renderNPCList = renderNPCList;
(window as any).renderNPCItem = renderNPCItem;
(window as any).selectNPC = selectNPC;
(window as any).showNPCDetail = showNPCDetail;
(window as any).clearNPCDetail = clearNPCDetail;
(window as any).setNpcFilter = setNpcFilter;
(window as any).toggleNPC = toggleNPC;
(window as any).renderNPCTags = renderNPCTags;
(window as any).updateNPCStats = updateNPCStats;
(window as any).toggleNPCCard = toggleNPCCard;
(window as any).expandAllNPCCards = expandAllNPCCards;
(window as any).collapseAllNPCCards = collapseAllNPCCards;
(window as any).expandAllNPCDialogs = expandAllNPCDialogs;
(window as any).collapseAllNPCDialogs = collapseAllNPCDialogs;
(window as any).showRelationsModal = showRelationsModal;
(window as any).setRelationStatus = setRelationStatus;
(window as any).addRelation = addRelation;
(window as any).removeRelation = removeRelation;
(window as any).cycleRelationStatus = cycleRelationStatus;
