// [SECTION:QUESTS_CRUD]
// ============================================================
// QUESTS CRUD - @create @edit @delete @save
// ============================================================

import { $, esc, sanitizeHTML } from '@utils/basic';
import { showToast, nextId, parseEntityId } from '@utils/utilities';
import { save } from '@systems/spellslots/persistence';
import { pushUndo } from '@systems/undo';
import { EntityLookup } from '@render/helpers';
import { deleteWithConfirm } from '@utils/crud-helpers';
import { showModal, hideModal } from '@systems/spellslots/navigation';

/**
 * Saves or updates a quest
 * Reads form data and creates/updates the quest entry
 */
export function saveQuest(): void {
    const D = (window as any).D;
    const renderQuests = (window as any).renderQuests;
    const validateAndShowErrors = (window as any).validateAndShowErrors;

    const idInput = $('edit-quest-id') as HTMLInputElement | null;
    const id = idInput?.value || '';

    // Collect reward items
    const rewardItemsEl = $('quest-reward-items-list');
    const rewardItems: Array<{ id: number; name: string }> = [];
    if (rewardItemsEl) {
        rewardItemsEl.querySelectorAll('.quest-reward-item-tag').forEach(tag => {
            const element = tag as HTMLElement;
            const itemId = element.dataset.itemId;
            const itemName = element.dataset.itemName;
            if (itemId && itemName) {
                rewardItems.push({ id: parseInt(itemId), name: itemName });
            }
        });
    }

    const giverSelect = $('quest-giver') as HTMLSelectElement;
    const locationSelect = $('quest-location') as HTMLSelectElement;
    const targetSelect = $('quest-target') as HTMLSelectElement;

    const q: any = {
        title: ($('quest-title') as HTMLInputElement).value.trim(),
        giverId: parseInt(giverSelect.value) || null,
        giverName: giverSelect.selectedOptions[0]?.text || '',
        locationId: parseInt(locationSelect.value) || null,
        locationName: locationSelect.selectedOptions[0]?.text || '',
        targetId: parseInt(targetSelect.value) || null,
        targetName: targetSelect.selectedOptions[0]?.text || '',
        type: ($('quest-type') as HTMLSelectElement).value,
        description: sanitizeHTML(($('quest-desc') as HTMLElement).innerHTML),
        rewardGold: parseInt(($('quest-reward-gold') as HTMLInputElement).value) || 0,
        rewardItems: rewardItems,
        rewardOther: ($('quest-reward-other') as HTMLInputElement).value.trim(),
        epilog: sanitizeHTML(($('quest-epilog') as HTMLElement).innerHTML),
        completed: ($('quest-completed') as HTMLInputElement).checked,
        rewardReceived: ($('quest-rewarded') as HTMLInputElement).checked
    };

    // Validate entity references and required fields
    if (!validateAndShowErrors(q, 'quest')) return;

    pushUndo(id ? 'Quest bearbeitet' : 'Quest erstellt');

    if (id) {
        const idx = D.quests.findIndex((x: any) => x.id === parseEntityId(id));
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

/**
 * Opens the edit modal for a quest
 */
export function editQuest(id: number | string): void {
    const q = EntityLookup.quest(id);
    if (!q) return;

    // First populate dropdowns
    populateQuestSelects();

    const idInput = $('edit-quest-id') as HTMLInputElement;
    if (idInput) idInput.value = String(id);

    ($('quest-title') as HTMLInputElement).value = q.title;
    ($('quest-type') as HTMLSelectElement).value = q.type || 'quest';
    ($('quest-desc') as HTMLElement).innerHTML = sanitizeHTML(q.description) || '';
    ($('quest-epilog') as HTMLElement).innerHTML = sanitizeHTML(q.epilog) || '';
    ($('quest-completed') as HTMLInputElement).checked = q.completed;
    ($('quest-rewarded') as HTMLInputElement).checked = q.rewardReceived;

    // Reward
    ($('quest-reward-gold') as HTMLInputElement).value = q.rewardGold ? String(q.rewardGold) : '';
    ($('quest-reward-other') as HTMLInputElement).value = q.rewardOther || q.reward || '';

    // Load reward items
    const itemsList = $('quest-reward-items-list');
    if (itemsList) {
        itemsList.innerHTML = '';
        (q.rewardItems || []).forEach((item: any) => {
            addQuestRewardItemTag(item.id, item.name);
        });
    }

    // Set dropdowns (with timeout so they are filled)
    setTimeout(() => {
        const giverSelect = $('quest-giver') as HTMLSelectElement;
        const locationSelect = $('quest-location') as HTMLSelectElement;
        const targetSelect = $('quest-target') as HTMLSelectElement;

        if (q.giverId && giverSelect) giverSelect.value = String(q.giverId);
        if (q.locationId && locationSelect) locationSelect.value = String(q.locationId);
        if (q.targetId && targetSelect) targetSelect.value = String(q.targetId);
    }, 10);

    showModal('quest-modal');
}

/**
 * Deletes a quest after confirmation
 */
export function deleteQuest(id: number | string): void {
    const renderQuests = (window as any).renderQuests;

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

export function clearQuestForm(): void {
    const idInput = $('edit-quest-id') as HTMLInputElement;
    if (idInput) idInput.value = '';

    ($('quest-title') as HTMLInputElement).value = '';
    ($('quest-giver') as HTMLSelectElement).value = '';
    ($('quest-location') as HTMLSelectElement).value = '';
    ($('quest-target') as HTMLSelectElement).value = '';
    ($('quest-type') as HTMLSelectElement).value = 'quest';
    ($('quest-desc') as HTMLElement).innerHTML = '';
    ($('quest-epilog') as HTMLElement).innerHTML = '';
    ($('quest-reward-gold') as HTMLInputElement).value = '';
    ($('quest-reward-other') as HTMLInputElement).value = '';
    ($('quest-reward-item') as HTMLSelectElement).value = '';

    const itemsList = $('quest-reward-items-list');
    if (itemsList) itemsList.innerHTML = '';

    ($('quest-completed') as HTMLInputElement).checked = false;
    ($('quest-rewarded') as HTMLInputElement).checked = false;
}

export function populateQuestSelects(): void {
    const D = (window as any).D;

    // NPC dropdown for quest giver
    const giverSelect = $('quest-giver') as HTMLSelectElement | null;
    if (giverSelect) {
        const currentValue = giverSelect.value;
        giverSelect.innerHTML = '<option value="">-- NPC wählen --</option>' +
            D.npcs.map((n: any) => `<option value="${n.id}">${esc(n.name)}${n.role ? ` (${esc(n.role)})` : ''}</option>`).join('');
        giverSelect.value = currentValue;
    }

    // Location dropdown
    const locationSelect = $('quest-location') as HTMLSelectElement | null;
    if (locationSelect) {
        const currentValue = locationSelect.value;
        locationSelect.innerHTML = '<option value="">-- Ort wählen --</option>' +
            D.locations.map((l: any) => `<option value="${l.id}">${esc(l.name)}</option>`).join('');
        locationSelect.value = currentValue;
    }

    // Target location dropdown
    const targetSelect = $('quest-target') as HTMLSelectElement | null;
    if (targetSelect) {
        const currentValue = targetSelect.value;
        targetSelect.innerHTML = '<option value="">-- Zielort wählen --</option>' +
            D.locations.map((l: any) => `<option value="${l.id}">${esc(l.name)}</option>`).join('');
        targetSelect.value = currentValue;
    }

    // Items from loot for reward
    const itemSelect = $('quest-reward-item') as HTMLSelectElement | null;
    if (itemSelect) {
        itemSelect.innerHTML = '<option value="">-- Item wählen --</option>' +
            D.loot.map((i: any) => `<option value="${i.id}" data-name="${esc(i.name)}">${esc(i.name)}${i.quantity > 1 ? ` (${i.quantity}x)` : ''}</option>`).join('');
    }
}

export function addQuestRewardItem(): void {
    const select = $('quest-reward-item') as HTMLSelectElement | null;
    if (!select || !select.value) return;

    const itemId = select.value;
    const option = select.selectedOptions[0] as HTMLOptionElement;
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

export function addQuestRewardItemTag(itemId: number | string, itemName: string): void {
    const itemsList = $('quest-reward-items-list');
    if (!itemsList) return;

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

(window as any).saveQuest = saveQuest;
(window as any).editQuest = editQuest;
(window as any).deleteQuest = deleteQuest;
(window as any).clearQuestForm = clearQuestForm;
(window as any).populateQuestSelects = populateQuestSelects;
(window as any).addQuestRewardItem = addQuestRewardItem;
(window as any).addQuestRewardItemTag = addQuestRewardItemTag;
