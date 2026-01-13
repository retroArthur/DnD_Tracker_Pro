// [SECTION:QUESTS_CRUD]
// ============================================================
// QUESTS CRUD - @create @edit @delete @save
// ============================================================
/**
 * Saves or updates a quest
 * Reads form data and creates/updates the quest entry
 */
function saveQuest() {
    const D = window.D;
    const renderQuests = window.renderQuests;
    const validateAndShowErrors = window.validateAndShowErrors;
    const idInput = $('edit-quest-id');
    const id = idInput?.value || '';
    // Collect reward items
    const rewardItemsEl = $('quest-reward-items-list');
    const rewardItems = [];
    if (rewardItemsEl) {
        rewardItemsEl.querySelectorAll('.quest-reward-item-tag').forEach(tag => {
            const element = tag;
            const itemId = element.dataset.itemId;
            const itemName = element.dataset.itemName;
            if (itemId && itemName) {
                rewardItems.push({ id: parseInt(itemId), name: itemName });
            }
        });
    }
    const giverSelect = $('quest-giver');
    const locationSelect = $('quest-location');
    const targetSelect = $('quest-target');
    const q = {
        title: $('quest-title').value.trim(),
        giverId: parseInt(giverSelect.value) || null,
        giverName: giverSelect.selectedOptions[0]?.text || '',
        locationId: parseInt(locationSelect.value) || null,
        locationName: locationSelect.selectedOptions[0]?.text || '',
        targetId: parseInt(targetSelect.value) || null,
        targetName: targetSelect.selectedOptions[0]?.text || '',
        type: $('quest-type').value,
        description: sanitizeHTML($('quest-desc').innerHTML),
        rewardGold: parseInt($('quest-reward-gold').value) || 0,
        rewardItems: rewardItems,
        rewardOther: $('quest-reward-other').value.trim(),
        epilog: sanitizeHTML($('quest-epilog').innerHTML),
        completed: $('quest-completed').checked,
        rewardReceived: $('quest-rewarded').checked
    };
    // Validate entity references and required fields
    if (!validateAndShowErrors(q, 'quest'))
        return;
    pushUndo(id ? 'Quest bearbeitet' : 'Quest erstellt');
    if (id) {
        const idx = D.quests.findIndex((x) => x.id === parseEntityId(id));
        if (idx > -1)
            D.quests[idx] = { ...D.quests[idx], ...q };
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
/**
 * Opens the edit modal for a quest
 */
function editQuest(id) {
    const q = EntityLookup.quest(id);
    if (!q)
        return;
    // First populate dropdowns
    populateQuestSelects();
    const idInput = $('edit-quest-id');
    if (idInput)
        idInput.value = String(id);
    $('quest-title').value = q.title;
    $('quest-type').value = q.type || 'quest';
    $('quest-desc').innerHTML = sanitizeHTML(q.description) || '';
    $('quest-epilog').innerHTML = sanitizeHTML(q.epilog) || '';
    $('quest-completed').checked = q.completed;
    $('quest-rewarded').checked = q.rewardReceived;
    // Reward
    $('quest-reward-gold').value = q.rewardGold ? String(q.rewardGold) : '';
    $('quest-reward-other').value = q.rewardOther || q.reward || '';
    // Load reward items
    const itemsList = $('quest-reward-items-list');
    if (itemsList) {
        itemsList.innerHTML = '';
        (q.rewardItems || []).forEach((item) => {
            addQuestRewardItemTag(item.id, item.name);
        });
    }
    // Set dropdowns (with timeout so they are filled)
    setTimeout(() => {
        const giverSelect = $('quest-giver');
        const locationSelect = $('quest-location');
        const targetSelect = $('quest-target');
        if (q.giverId && giverSelect)
            giverSelect.value = String(q.giverId);
        if (q.locationId && locationSelect)
            locationSelect.value = String(q.locationId);
        if (q.targetId && targetSelect)
            targetSelect.value = String(q.targetId);
    }, 10);
    showModal('quest-modal');
}
/**
 * Deletes a quest after confirmation
 */
function deleteQuest(id) {
    const renderQuests = window.renderQuests;
    deleteWithConfirm({
        entityType: 'quests',
        id: id,
        confirmMessage: null, // Use default message (uses 'name' property)
        undoLabel: 'Quest gelöscht',
        onSuccess: () => {
            renderQuests();
            showToast('✅ Quest gelöscht', 'success');
        }
    });
}
function clearQuestForm() {
    clearFormFields({
        textFields: [
            'edit-quest-id', 'quest-title', 'quest-giver', 'quest-location',
            'quest-target', 'quest-reward-gold', 'quest-reward-other', 'quest-reward-item'
        ],
        selectFields: [{ id: 'quest-type', defaultValue: 'quest' }],
        contentEditableFields: ['quest-desc', 'quest-epilog'],
        checkboxFields: ['quest-completed', 'quest-rewarded'],
        customHandlers: () => {
            const itemsList = $('quest-reward-items-list');
            if (itemsList) itemsList.innerHTML = '';
        }
    });
}
function populateQuestSelects() {
    const D = window.D;
    // NPC dropdown for quest giver
    const giverSelect = $('quest-giver');
    if (giverSelect) {
        const currentValue = giverSelect.value;
        giverSelect.innerHTML = '<option value="">-- NPC wählen --</option>' +
            D.npcs.map((n) => `<option value="${n.id}">${esc(n.name)}${n.role ? ` (${esc(n.role)})` : ''}</option>`).join('');
        giverSelect.value = currentValue;
    }
    // Location dropdown
    const locationSelect = $('quest-location');
    if (locationSelect) {
        const currentValue = locationSelect.value;
        locationSelect.innerHTML = '<option value="">-- Ort wählen --</option>' +
            D.locations.map((l) => `<option value="${l.id}">${esc(l.name)}</option>`).join('');
        locationSelect.value = currentValue;
    }
    // Target location dropdown
    const targetSelect = $('quest-target');
    if (targetSelect) {
        const currentValue = targetSelect.value;
        targetSelect.innerHTML = '<option value="">-- Zielort wählen --</option>' +
            D.locations.map((l) => `<option value="${l.id}">${esc(l.name)}</option>`).join('');
        targetSelect.value = currentValue;
    }
    // Items from loot for reward
    const itemSelect = $('quest-reward-item');
    if (itemSelect) {
        itemSelect.innerHTML = '<option value="">-- Item wählen --</option>' +
            D.loot.map((i) => `<option value="${i.id}" data-name="${esc(i.name)}">${esc(i.name)}${i.quantity > 1 ? ` (${i.quantity}x)` : ''}</option>`).join('');
    }
}
function addQuestRewardItem() {
    const select = $('quest-reward-item');
    if (!select || !select.value)
        return;
    const itemId = select.value;
    const option = select.selectedOptions[0];
    const itemName = option.dataset.name || '';
    // Check if item already added
    const itemsList = $('quest-reward-items-list');
    if (itemsList?.querySelector(`[data-item-id="${itemId}"]`)) {
        showToast('Item bereits hinzugefügt');
        return;
    }
    addQuestRewardItemTag(itemId, itemName);
    select.value = '';
}
function addQuestRewardItemTag(itemId, itemName) {
    const itemsList = $('quest-reward-items-list');
    if (!itemsList)
        return;
    const tag = document.createElement('span');
    tag.className = 'quest-reward-item-tag';
    tag.dataset.itemId = String(itemId);
    tag.dataset.itemName = itemName;
    tag.innerHTML = `📦 ${esc(itemName)} <button type="button" class="remove-btn" data-action="remove-parent">×</button>`;
    itemsList.appendChild(tag);
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.saveQuest = saveQuest;
window.editQuest = editQuest;
window.deleteQuest = deleteQuest;
window.clearQuestForm = clearQuestForm;
window.populateQuestSelects = populateQuestSelects;
window.addQuestRewardItem = addQuestRewardItem;
window.addQuestRewardItemTag = addQuestRewardItemTag;
