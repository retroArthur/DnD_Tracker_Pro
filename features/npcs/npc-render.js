// ============================================================
// NPC RENDER - Master-Detail Layout (wie Orte)
// ============================================================

// State
let selectedNpcId = null;
let currentNpcFilter = 'all';

// NPC type icons based on race
const NPC_ICONS = {
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

function getNPCIcon(npc) {
    const race = (npc.race || '').toLowerCase();
    for (const [key, icon] of Object.entries(NPC_ICONS)) {
        if (race.includes(key)) return icon;
    }
    return NPC_ICONS.default;
}

/**
 * Rendert die NPC-Liste im Master-Detail Layout
 * Beruecksichtigt aktive Filter und Suchbegriffe
 */
function renderNPCList() {
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
            ${locations.slice(0, 5).map(loc => `
                <div class="npc-filter-chip ${currentNpcFilter === loc.id ? 'active' : ''}"
                     data-action="set-npc-filter" data-id="${loc.id}">
                    ${esc(loc.name)}
                </div>
            `).join('')}
            ${locations.length > 5 ? `
                <select class="npc-filter-select" onchange="setNpcFilter(this.value ? parseInt(this.value) : 'all')">
                    <option value="">Mehr...</option>
                    ${locations.slice(5).map(loc => `<option value="${loc.id}">${esc(loc.name)}</option>`).join('')}
                </select>
            ` : ''}
        `;
    }

    // Get search and filter
    const search = ($('npc-search')?.value || '').toLowerCase();
    let npcs = [...(D.npcs || [])];

    // Apply location filter
    if (currentNpcFilter !== 'all') {
        npcs = npcs.filter(n => n.locationId === currentNpcFilter);
    }

    // Apply search
    if (search) {
        npcs = npcs.filter(n =>
            n.name.toLowerCase().includes(search) ||
            (n.role || '').toLowerCase().includes(search) ||
            (n.race || '').toLowerCase().includes(search) ||
            (n.description || '').toLowerCase().includes(search) ||
            (n.dialogs || []).some(d => (d.text || '').toLowerCase().includes(search))
        );
    }

    // Sort alphabetically
    npcs.sort((a, b) => a.name.localeCompare(b.name));

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
    listContainer.innerHTML = npcs.map(npc => renderNPCItem(npc)).join('');

    // Auto-select first if none selected
    if (!selectedNpcId || !npcs.find(n => n.id === selectedNpcId)) {
        selectNPC(npcs[0].id, false);
    } else {
        showNPCDetail(selectedNpcId);
    }

    // Update stats
    updateNPCStats();
}

function renderNPCItem(npc) {
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

function selectNPC(id, scroll = true) {
    selectedNpcId = id;

    // Update selection in list
    document.querySelectorAll('.npc-item').forEach(el => {
        el.classList.toggle('selected', el.dataset.id == id);
    });

    // Show detail
    showNPCDetail(id);

    // Scroll into view if needed
    if (scroll) {
        const item = document.querySelector(`.npc-item[data-id="${id}"]`);
        if (item) {
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

/**
 * Zeigt die Detail-Ansicht eines NPCs im rechten Panel
 * @param {number|string} id - NPC ID
 */
function showNPCDetail(id) {
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
    const usedDialogs = dialogs.filter(d => d.used).length;
    const tags = npc.tags || [];
    const links = npc.links || [];

    // Build dialogs list
    const dialogsHtml = dialogs.length ? dialogs.map((d, idx) => `
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
    const triggersHtml = triggers.length ? triggers.map((t, idx) => `
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
    const tagsHtml = tags.length ? tags.map(t => `<span class="npc-tag">${esc(t)}</span>`).join('') : '';

    // Build links
    const linksHtml = links.length ? links.map(link => {
        const target = EntityLookup[link.type]?.(link.id);
        if (!target) return '';
        const icons = { characters: '👤', npcs: '🎭', locations: '📍', quests: '📜', encounters: '⚔️' };
        return `<span class="npc-link" data-action="navigate-entity" data-type="${link.type}" data-id="${link.id}">${icons[link.type] || '🔗'} ${esc(target.name)}</span>`;
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

function clearNPCDetail() {
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

function setNpcFilter(f) {
    currentNpcFilter = f;
    selectedNpcId = null;
    renderNPCList();
}

function toggleNPC(id) {
    // For search navigation: select and show the NPC
    const npc = EntityLookup.npc(id);
    if (!npc) return;

    currentNpcFilter = 'all';
    selectedNpcId = id;
    renderNPCList();

    setTimeout(() => {
        const item = document.querySelector(`.npc-item[data-id="${id}"]`);
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
function renderNPCTags(n) {
    const questTags = (n.quests || []).map(q => {
        const quest = (D.quests || []).find(qst => qst.name && qst.name.toLowerCase() === q.toLowerCase());
        if (quest) {
            return `<span class="npc-list-tag quest clickable" data-action="navigate-entity-stop" data-type="quests" data-id="${quest.id}">📜 ${esc(q)}</span>`;
        }
        return `<span class="npc-list-tag quest">📜 ${esc(q)}</span>`;
    }).join('');

    const relationTags = (n.relationships || []).map(r => {
        const npc = (D.npcs || []).find(np => np.name && np.name.toLowerCase() === r.toLowerCase());
        const char = (D.characters || []).find(c => c.name && c.name.toLowerCase() === r.toLowerCase());
        if (npc) {
            return `<span class="npc-list-tag relation clickable" data-action="navigate-entity-stop" data-type="npcs" data-id="${npc.id}">👥 ${esc(r)}</span>`;
        } else if (char) {
            return `<span class="npc-list-tag relation clickable" data-action="navigate-entity-stop" data-type="characters" data-id="${char.id}">👥 ${esc(r)}</span>`;
        }
        return `<span class="npc-list-tag relation">👥 ${esc(r)}</span>`;
    }).join('');

    const infoTags = (n.info || []).map(i => `<span class="npc-list-tag info">ℹ️ ${esc(i)}</span>`).join('');

    return { questTags, relationTags, infoTags };
}

function updateNPCStats() {
    if (!D.npcs) return;
    const totalDialogs = D.npcs.reduce((sum, n) => sum + (n.dialogs?.length || 0), 0);
    const totalTriggers = D.npcs.reduce((sum, n) => sum + (n.triggers?.length || 0), 0);
    updateCounters({
        'npc-stats-total': D.npcs.length,
        'npc-stats-dialogs': totalDialogs,
        'npc-stats-triggers': totalTriggers
    });
}

// Legacy compatibility functions
function toggleNPCCard(id) {
    selectNPC(id);
}

function expandAllNPCCards() {
    showToast('Alle NPCs werden in der Liste angezeigt');
}

function collapseAllNPCCards() {
    selectedNpcId = null;
    clearNPCDetail();
    showToast('Details-Panel geleert');
}

function expandAllNPCDialogs() {
    showToast('Dialoge werden im Detail-Panel angezeigt');
}

function collapseAllNPCDialogs() {
    showToast('Wähle einen NPC für Details');
}
