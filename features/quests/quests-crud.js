// ============================================================
// QUESTS CRUD - Create, Read, Update, Delete Operationen
// ============================================================
// Extrahiert aus features/render-quests.js

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
    } else {
        q.id = nextId('quests');
        D.quests.push(q);
    }
    hideModal('quest-modal');
    clearQuestForm();
    renderQuests();
    save();
}

function editQuest(id) {
    const q = EntityLookup.quest(id);
    if (!q) return;

    // Erst Dropdowns befüllen
    populateQuestSelects();

    $('edit-quest-id').value = id;
    $('quest-title').value = q.title;
    $('quest-type').value = q.type || 'quest';
    $('quest-desc').innerHTML = sanitizeHTML(q.description) || '';
    $('quest-epilog').innerHTML = sanitizeHTML(q.epilog) || '';
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
