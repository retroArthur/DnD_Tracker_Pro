// [SECTION:TAGS]
// ============================================================
// TAGS SYSTEM - @tag @label @category @filter
// ============================================================
function showTagsModal(type, id) {
    $('tags-target-type').value = type;
    $('tags-target-id').value = id;
    $('new-tag-name').value = '';
    renderTagsModal();
    showModal('tags-modal');
}

function renderTagsModal() {
    const type = $('tags-target-type').value;
    const id = parseEntityId($('tags-target-id').value);
    const entity = getEntityByTypeAndId(type, id);
    
    // Entity's current tags
    const entityTags = entity?.tags || [];
    const entityTagsEl = $('entity-tags-list');
    entityTagsEl.innerHTML = entityTags.length ? entityTags.map((t, i) => 
        `<span class="tag tag-${t.color || 'blue'}">${esc(t.name)} <span style="cursor:pointer;" data-action="remove-tag" data-id="${i}">✕</span></span>`
    ).join('') : '<span style="color: var(--text-dim);">Keine Tags</span>';
    
    // All available tags (from D.tags) - clickable to add
    const allTags = D.tags || [];
    const allTagsEl = $('all-tags-list');
    allTagsEl.innerHTML = allTags.length ? allTags.map(t => {
        const hasTag = entityTags.some(et => et.name === t.name);
        return `<span class="tag tag-${t.color || 'blue'}" style="cursor: pointer; ${hasTag ? 'opacity: 0.5;' : ''}" data-action="add-existing-tag" data-value="${esc(t.name)}" data-color="${t.color}">${esc(t.name)}</span>`;
    }).join('') : '<span style="color: var(--text-dim);">Keine globalen Tags</span>';
    
    // Global tags with delete option
    const globalTagsEl = $('global-tags-list');
    globalTagsEl.innerHTML = allTags.length ? allTags.map((t, i) => 
        `<span class="tag tag-${t.color || 'blue'}" style="display: inline-flex; align-items: center; gap: 4px;">
            ${esc(t.name)} 
            <span style="cursor:pointer; color: var(--red); font-weight: bold;" data-action="delete-global-tag" data-value="${i}" title="Tag überall löschen">✕</span>
        </span>`
    ).join('') : '<span style="color: var(--text-dim);">Keine globalen Tags vorhanden</span>';
}

function deleteGlobalTag(index) {
    const allTags = D.tags || [];
    if (index < 0 || index >= allTags.length) return;
    
    const tagToDelete = allTags[index];
    if (!confirm(`Tag "${tagToDelete.name}" wirklich löschen?\n\nDer Tag wird von allen NPCs, Orten und Quests entfernt.`)) return;
    
    // Remove from all entities
    ['npcs', 'locations', 'quests'].forEach(type => {
        (D[type] || []).forEach(entity => {
            if (entity.tags) {
                entity.tags = entity.tags.filter(t => t.name !== tagToDelete.name);
            }
        });
    });
    
    // Remove from global tags
    D.tags.splice(index, 1);
    
    renderTagsModal();
    renderAll();
    save();
    showToast(`Tag "${tagToDelete.name}" gelöscht`);
}

function addTagToEntity() {
    const name = $('new-tag-name').value.trim();
    if (!name) return;
    
    const color = $('new-tag-color').value;
    const type = $('tags-target-type').value;
    const id = parseEntityId($('tags-target-id').value);
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return;
    
    if (!entity.tags) entity.tags = [];
    if (entity.tags.some(t => t.name === name)) {
        showToast('Tag existiert bereits');
        return;
    }
    
    entity.tags.push({ name, color });
    
    // Also add to global tags if not exists
    if (!D.tags) D.tags = [];
    if (!D.tags.some(t => t.name === name)) {
        D.tags.push({ name, color });
    }
    
    $('new-tag-name').value = '';
    renderTagsModal();
    renderAll();
    save();
}

function addExistingTagToEntity(name, color) {
    const type = $('tags-target-type').value;
    const id = parseEntityId($('tags-target-id').value);
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return;
    
    if (!entity.tags) entity.tags = [];
    if (entity.tags.some(t => t.name === name)) return;
    
    entity.tags.push({ name, color });
    renderTagsModal();
    renderAll();
    save();
}

function removeTagFromEntity(index) {
    const type = $('tags-target-type').value;
    const id = parseEntityId($('tags-target-id').value);
    const entity = getEntityByTypeAndId(type, id);
    if (!entity || !entity.tags) return;
    
    entity.tags.splice(index, 1);
    renderTagsModal();
    renderAll();
    save();
}

function renderTagsBar(tags) {
    if (!tags || !tags.length) return '';
    return `<div class="tags-container" style="margin-top: 4px;">
        ${tags.map(t => `<span class="tag tag-${t.color || 'blue'} clickable" data-action="show-entities-with-tag-stop" data-value="${esc(t.name)}" title="Alle mit Tag '${esc(t.name)}' anzeigen">${esc(t.name)}</span>`).join('')}
    </div>`;
}

// Zeigt alle Entities mit einem bestimmten Tag
function showEntitiesWithTag(tagName) {
    const results = [];
    const ENTITY_ICONS = { characters: '👥', npcs: '🎭', locations: '🏠', quests: '📜', encounters: '👹', spells: '✨', loot: '💎', wiki: '📖' };
    
    // Durchsuche alle Entity-Typen
    const searchIn = [
        { type: 'characters', items: D.characters || [], label: 'Charakter' },
        { type: 'npcs', items: D.npcs || [], label: 'NPC' },
        { type: 'locations', items: D.locations || [], label: 'Ort' },
        { type: 'quests', items: D.quests || [], label: 'Quest' },
        { type: 'encounters', items: D.encounters || [], label: 'Begegnung' },
        { type: 'spells', items: D.spells || [], label: 'Zauber' },
        { type: 'loot', items: D.loot || [], label: 'Item' },
        { type: 'wiki', items: D.wiki || [], label: 'Wiki' }
    ];
    
    searchIn.forEach(({ type, items, label }) => {
        items.forEach(item => {
            if (item.tags?.some(t => t.name === tagName)) {
                results.push({
                    type,
                    id: item.id,
                    name: item.name || item.title || 'Unbenannt',
                    icon: ENTITY_ICONS[type],
                    label
                });
            }
        });
    });
    
    // Modal erstellen/aktualisieren
    let modal = $('tag-search-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'tag-search-modal';
        modal.innerHTML = `
            <div class="modal" style="max-width: 500px;">
                <div class="modal-header">
                    <span class="modal-title" id="tag-search-title">🏷️ Tag-Suche</span>
                    <button class="btn btn-sm" data-action="hide-modal" data-value="tag-search-modal">✕</button>
                </div>
                <div id="tag-search-results" style="max-height: 400px; overflow-y: auto;"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    $('tag-search-title').textContent = `🏷️ Tag: "${tagName}"`;
    
    if (results.length === 0) {
        $('tag-search-results').innerHTML = renderEmptyState({
            icon: '🏷️',
            titleEmpty: 'Keine Ergebnisse',
            descEmpty: `Keine Einträge mit Tag "${esc(tagName)}" gefunden.`,
            gridSpan: 'auto'
        });
    } else {
        $('tag-search-results').innerHTML = results.map(r => `
            <div class="search-result-item" data-action="tag-search-navigate" data-type="${r.type}" data-id="${r.id}" style="display: flex; align-items: center; gap: 10px; padding: 10px; cursor: pointer; border-bottom: 1px solid var(--border);">
                <span style="font-size: 1.2em;">${r.icon}</span>
                <div>
                    <div style="font-weight: 500;">${esc(r.name)}</div>
                    <div style="font-size: 0.8em; color: var(--text-dim);">${r.label}</div>
                </div>
            </div>
        `).join('');
    }
    
    showModal('tag-search-modal');
}

// ============================================================