// ============================================================
// QUESTS - Render-Funktionen  
// ============================================================
// Extrahiert aus render/main.js

function renderQuests() {
    const c = $('quests-list'); if (!c) return;
    const activeOnly = $('quest-filter-active')?.checked;
    const search = ($('quest-search')?.value || '').toLowerCase();
    let quests = D.quests;
    
    if (activeOnly) quests = quests.filter(q => !q.completed);
    if (search) quests = quests.filter(q => 
        q.title.toLowerCase().includes(search) ||
        (q.giverName || '').toLowerCase().includes(search) ||
        (q.locationName || '').toLowerCase().includes(search) ||
        (q.description || '').toLowerCase().includes(search)
    );
    
    if (!quests.length) { 
        c.innerHTML = renderEmptyState({
            icon: '📜',
            titleEmpty: 'Keine Quests',
            descEmpty: 'Erstelle Aufträge und Missionen für deine Abenteurer.',
            buttonText: '➕ Quest erstellen',
            buttonAction: 'show-modal',
            buttonValue: 'quest-modal',
            isFiltered: !!(search || activeOnly)
        });
        return; 
    }
    
    c.innerHTML = quests.map(q => {
        const entityLinks = renderEntityLinks(q.links);
        const entityTags = renderTagsBar(q.tags);
        
        // Quest-Geber Name ermitteln (mit EntityLookup)
        const giverDisplay = q.giverId 
            ? EntityLookup.getName('npcs', q.giverId) 
            : (q.giverName || q.giver || '');
        
        // Ort-Name ermitteln (mit EntityLookup)
        const locationDisplay = q.locationId 
            ? EntityLookup.getName('locations', q.locationId) 
            : (q.locationName || q.location || '');
        
        // Zielort-Name ermitteln (mit EntityLookup)
        const targetDisplay = q.targetId 
            ? EntityLookup.getName('locations', q.targetId) 
            : (q.targetName || q.target || '');
        
        // Belohnung zusammenstellen
        let rewardParts = [];
        if (q.rewardGold > 0) rewardParts.push(`${q.rewardGold} GP`);
        if (q.rewardItems?.length) rewardParts.push(q.rewardItems.map(i => i.name).join(', '));
        if (q.rewardOther) rewardParts.push(q.rewardOther);
        if (q.reward && !q.rewardGold && !q.rewardItems?.length && !q.rewardOther) {
            rewardParts.push(q.reward); // Legacy-Feld
        }
        const rewardDisplay = rewardParts.join(' + ') || '—';
        
        // Quest-Typ Badge
        const typeClass = q.type === 'plot' ? 'plot-quest' : q.type === 'side' ? 'side-quest' : 'quest';
        const typeLabel = q.type === 'plot' ? 'Plot' : q.type === 'side' ? 'Side' : 'Quest';
        
        return `<div class="quest-item ${typeClass} ${q.completed ? 'completed' : ''}" id="quest-${q.id}" draggable="true" data-sortable data-id="${q.id}">
        <div class="quest-header" data-action="toggle-quest" data-id="${q.id}">
            <div class="quest-title-row">
                <span class="drag-handle" title="Zum Sortieren ziehen">⋮⋮</span>
                <button class="btn btn-sm" style="padding: 2px 6px; font-size: 12px; ${q.tracked ? 'background: var(--gold); color: var(--bg-dark);' : ''}" data-action="toggle-quest-tracked-stop" data-id="${q.id}" title="${q.tracked ? 'Wird verfolgt' : 'Verfolgen'}">📌</button>
                <span class="quest-title">${esc(q.title)}</span>
                <span class="quest-type-badge ${q.type || 'quest'}">${typeLabel}</span>
                ${giverDisplay ? renderEntityLink('npcs', q.giverId, giverDisplay, { icon: '👤', fallbackColor: 'var(--cyan)' }) : ''}
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
                <span class="chip ${q.completed ? 'color-green' : ''}" data-action="toggle-quest-status-stop" data-id="${q.id}" data-value="completed">${q.completed ? '✓' : '○'} Done</span>
                <span class="chip ${q.rewardReceived ? 'color-green' : ''}" data-action="toggle-quest-status-stop" data-id="${q.id}" data-value="reward">${q.rewardReceived ? '✓' : '○'} Loot</span>
                <span style="color:var(--text-dim);">▼</span>
            </div>
        </div>
        <div class="quest-details">
            <div style="margin-bottom:10px;">${q.description || ''}</div>
            ${entityTags}
            ${entityLinks}
            <div style="display:flex; flex-wrap:wrap; gap:15px; font-size:0.9em; margin-bottom:10px;">
                <div><span style="color:var(--text-dim);">📍 Ort:</span> ${renderEntityLink('locations', q.locationId, locationDisplay || '—')}</div>
                <div><span style="color:var(--text-dim);">🎯 Ziel:</span> ${renderEntityLink('locations', q.targetId, targetDisplay || '—')}</div>
                <div><span style="color:var(--text-dim);">💰 Belohnung:</span> <span style="color:var(--gold);">${esc(rewardDisplay)}</span></div>
            </div>
            ${q.epilog ? `<div class="quest-epilog"><div style="font-size:0.8em; color:var(--purple); margin-bottom:4px;">Epilog / Nachwirkungen:</div><div style="font-size:0.9em;">${q.epilog}</div></div>` : ''}
            <div class="btn-group">
                <button class="btn btn-sm" data-action="show-entity-links-modal" data-type="quests" data-id="${q.id}" title="Verknüpfungen">🔗</button>
                <button class="btn btn-sm" data-action="show-tags-modal" data-type="quests" data-id="${q.id}" title="Tags">🏷️</button>
                <button class="btn btn-sm" data-action="edit-quest" data-id="${q.id}">✏️</button>
                <button class="btn btn-sm btn-danger" data-action="delete-quest" data-id="${q.id}">🗑️</button>
            </div>
        </div>
    </div>`;
    }).join('');
}

function toggleQuest(id) { $(`quest-${id}`)?.classList.toggle('expanded'); }

function toggleQuestTracked(id) {
    const q = EntityLookup.quest(id); 
    if (!q) return;
    q.tracked = !q.tracked;
    renderQuests(); 
    renderDashboard();
    save();
    showToast(q.tracked ? '📌 Quest wird verfolgt' : '📌 Quest nicht mehr verfolgt');
}

function toggleQuestStatus(id, type) {
    const q = EntityLookup.quest(id); if (!q) return;
    if (type === 'completed') { q.completed = !q.completed; if (!q.completed) q.rewardReceived = false; }
    else { q.rewardReceived = !q.rewardReceived; if (q.rewardReceived) q.completed = true; }
    renderQuests(); save();
}

function saveQuest() {
    const id = $('edit-quest-id').value;
    
    // Belohnungs-Items sammeln
    const rewardItemsEl = $('quest-reward-items-list');
    const rewardItems = [];
    if (rewardItemsEl) {
        rewardItemsEl.querySelectorAll('.quest-reward-item-tag').forEach(tag => {
            const itemId = tag.dataset.itemId;
            const itemName = tag.dataset.itemName;
            if (itemId && itemName) {
                rewardItems.push({ id: parseInt(itemId), name: itemName });
            }
        });
    }
    
    const q = {
        title: $('quest-title').value.trim(), 
        giverId: parseInt($('quest-giver').value) || null,
        giverName: $('quest-giver').selectedOptions[0]?.text || '',
        locationId: parseInt($('quest-location').value) || null,
        locationName: $('quest-location').selectedOptions[0]?.text || '',
        targetId: parseInt($('quest-target').value) || null,
        targetName: $('quest-target').selectedOptions[0]?.text || '',
        type: $('quest-type').value, 
        description: sanitizeHTML($('quest-desc').innerHTML),
        rewardGold: parseInt($('quest-reward-gold').value) || 0,
        rewardItems: rewardItems,
        rewardOther: $('quest-reward-other').value.trim(),
        epilog: sanitizeHTML($('quest-epilog').innerHTML),
        completed: $('quest-completed').checked, 
        rewardReceived: $('quest-rewarded').checked
    };
    if (!q.title) { showToast('⚠️ Titel erforderlich', 'error'); return; }
    
    pushUndo(id ? 'Quest bearbeitet' : 'Quest erstellt');
    
    if (id) { 
        const idx = D.quests.findIndex(x => x.id === parseInt(id)); 
        if (idx > -1) D.quests[idx] = { ...D.quests[idx], ...q }; 
    }
    else { 
        q.id = nextId('quests'); 
        D.quests.push(q); 
    }
    hideModal('quest-modal'); 
    clearQuestForm(); 
    renderQuests(); 
    save();
}

function editQuest(id) {
    const q = EntityLookup.quest(id); if (!q) return;
    
    // Erst Dropdowns befüllen
    populateQuestSelects();
    
    $('edit-quest-id').value = id;
    $('quest-title').value = q.title;
    $('quest-type').value = q.type || 'quest';
    $('quest-desc').innerHTML = sanitizeHTML(q.description) || '';
    $('quest-epilog').innerHTML = q.epilog || '';
    $('quest-completed').checked = q.completed;
    $('quest-rewarded').checked = q.rewardReceived;
    
    // Belohnung
    $('quest-reward-gold').value = q.rewardGold || '';
    $('quest-reward-other').value = q.rewardOther || q.reward || '';
    
    // Belohnungs-Items laden
    const itemsList = $('quest-reward-items-list');
    if (itemsList) {
        itemsList.innerHTML = '';
        (q.rewardItems || []).forEach(item => {
            addQuestRewardItemTag(item.id, item.name);
        });
    }
    
    // Dropdowns setzen (mit Timeout damit sie gefüllt sind)
    setTimeout(() => {
        if (q.giverId) $('quest-giver').value = String(q.giverId);
        if (q.locationId) $('quest-location').value = String(q.locationId);
        if (q.targetId) $('quest-target').value = String(q.targetId);
    }, 10);
    
    showModal('quest-modal');
}

function deleteQuest(id) { 
    if (confirm('Löschen?')) { 
        pushUndo('Quest gelöscht');
        D.quests = D.quests.filter(q => q.id !== id); 
        renderQuests(); 
        save(); 
    } 
}

function clearQuestForm() {
    $('edit-quest-id').value = '';
    $('quest-title').value = '';
    $('quest-giver').value = '';
    $('quest-location').value = '';
    $('quest-target').value = '';
    $('quest-type').value = 'quest';
    $('quest-desc').innerHTML = '';
    $('quest-epilog').innerHTML = '';
    $('quest-reward-gold').value = '';
    $('quest-reward-other').value = '';
    $('quest-reward-item').value = '';
    const itemsList = $('quest-reward-items-list');
    if (itemsList) itemsList.innerHTML = '';
    $('quest-completed').checked = false;
    $('quest-rewarded').checked = false;
}

function populateQuestSelects() {
    // NPC-Dropdown für Quest-Geber
    const giverSelect = $('quest-giver');
    if (giverSelect) {
        const currentValue = giverSelect.value;
        giverSelect.innerHTML = '<option value="">-- NPC wählen --</option>' +
            D.npcs.map(n => `<option value="${n.id}">${esc(n.name)}${n.role ? ` (${esc(n.role)})` : ''}</option>`).join('');
        giverSelect.value = currentValue;
    }
    
    // Ort-Dropdown
    const locationSelect = $('quest-location');
    if (locationSelect) {
        const currentValue = locationSelect.value;
        locationSelect.innerHTML = '<option value="">-- Ort wählen --</option>' +
            D.locations.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('');
        locationSelect.value = currentValue;
    }
    
    // Zielort-Dropdown
    const targetSelect = $('quest-target');
    if (targetSelect) {
        const currentValue = targetSelect.value;
        targetSelect.innerHTML = '<option value="">-- Zielort wählen --</option>' +
            D.locations.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('');
        targetSelect.value = currentValue;
    }
    
    // Items aus Truhe für Belohnung
    const itemSelect = $('quest-reward-item');
    if (itemSelect) {
        itemSelect.innerHTML = '<option value="">-- Item wählen --</option>' +
            D.loot.map(i => `<option value="${i.id}" data-name="${esc(i.name)}">${esc(i.name)}${i.quantity > 1 ? ` (${i.quantity}x)` : ''}</option>`).join('');
    }
}

function addQuestRewardItem() {
    const select = $('quest-reward-item');
    if (!select || !select.value) return;
    
    const itemId = select.value;
    const itemName = select.selectedOptions[0].dataset.name;
    
    // Prüfen ob Item schon hinzugefügt
    const itemsList = $('quest-reward-items-list');
    if (itemsList.querySelector(`[data-item-id="${itemId}"]`)) {
        showToast('Item bereits hinzugefügt');
        return;
    }
    
    addQuestRewardItemTag(itemId, itemName);
    select.value = '';
}

function addQuestRewardItemTag(itemId, itemName) {
    const itemsList = $('quest-reward-items-list');
    if (!itemsList) return;
    
    const tag = document.createElement('span');
    tag.className = 'quest-reward-item-tag';
    tag.dataset.itemId = itemId;
    tag.dataset.itemName = itemName;
    tag.innerHTML = `📦 ${esc(itemName)} <button type="button" class="remove-btn" data-action="remove-parent">×</button>`;
    itemsList.appendChild(tag);
}

// ============================================================
// ENCOUNTERS
// ============================================================

