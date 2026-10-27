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
    let id = idInput?.value || '';
    // Zeigt die ID auf eine Quest, die es nicht mehr gibt (geloescht, oder per
    // Strg+Z zurueckgenommen, waehrend das Formular offen war), wird als NEUE
    // Quest gespeichert — die Eingaben bleiben erhalten. Vorher fand der
    // Bearbeiten-Zweig nichts, schrieb nichts und schloss trotzdem, ohne jede
    // Meldung und mit einem leeren Undo-Eintrag "Quest bearbeitet" (gemessen:
    // Eingabe still weg, und der leere Eintrag leerte den Wiederholen-Stapel).
    // Geprueft VOR pushUndo, wie in saveNPC().
    const idx = id ? D.quests.findIndex(x => x.id === parseEntityId(id)) : -1;
    const verwaist = Boolean(id) && idx === -1;
    if (verwaist) id = '';
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
    if (!validateAndShowErrors(q, 'quest')) return;
    pushUndo(id ? 'Quest bearbeitet' : 'Quest erstellt');
    if (id) {
        D.quests[idx] = { ...D.quests[idx], ...q };
    } else {
        q.id = nextId('quests');
        D.quests.push(q);
    }
    hideModal('quest-modal');
    clearQuestForm();
    renderQuests();
    save();
    // Nur die Warnung: eine Erfolgsmeldung hatte saveQuest() nie, und eine
    // neue gehoert nicht in diese Behebung.
    if (verwaist) {
        showToast(
            'Die bearbeitete Quest existiert nicht mehr — als neue Quest gespeichert',
            'warning'
        );
    }
}
/**
 * Opens the edit modal for a quest
 */
function editQuest(id) {
    const q = EntityLookup.quest(id);
    if (!q) return;
    // First populate dropdowns
    populateQuestSelects();
    const idInput = $('edit-quest-id');
    if (idInput) idInput.value = String(id);
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
        (q.rewardItems || []).forEach(item => {
            addQuestRewardItemTag(item.id, item.name);
        });
    }
    // Set dropdowns (with timeout so they are filled)
    // Auch die LEERE Auswahl ausdruecklich setzen: populateQuestSelects() haelt
    // beim Neubefuellen den bisherigen Wert. Vorher setzte dieser Block nur
    // wahre Werte — gemessen trug ✏️ Botengang (ohne Geber, Ort, Ziel) nach
    // abgebrochenem ✏️ Drachenjagd deren Geber 1, Ort 1, Ziel 2, und 💾 schrieb
    // sie in Botengang; ebenso die Auswahl eines Anlege-Entwurfs.
    setTimeout(() => {
        const giverSelect = $('quest-giver');
        const locationSelect = $('quest-location');
        const targetSelect = $('quest-target');
        if (giverSelect) giverSelect.value = q.giverId ? String(q.giverId) : '';
        if (locationSelect) locationSelect.value = q.locationId ? String(q.locationId) : '';
        if (targetSelect) targetSelect.value = q.targetId ? String(q.targetId) : '';
    }, 10);

    // Show markdown export/import buttons when editing
    const markdownActions = $('quest-markdown-actions');
    if (markdownActions) {
        markdownActions.style.display = 'block';
    }

    showModal('quest-modal');
}
/**
 * Oeffnet das Quest-Formular zum Anlegen — der Weg aller vier Anlegen-Knoepfe
 * ("+ Quest", Knopf der leeren Liste, Taste n, Befehlspalette "Neue Quest").
 * Vorher oeffneten sie per showModal('quest-modal') das Formular mit dem, was
 * ein abgebrochenes Bearbeiten (✕ oder Escape) darin liess, samt
 * #edit-quest-id: gemessen UEBERSCHRIEB das naechste "Anlegen" die zuletzt
 * bearbeitete Quest (Geber, Ort, Ziel, Gold, Items blieben stehen, nur der
 * Titel wechselte) — in D, im Speicher und nach dem Neuladen, ohne Meldung.
 * Geleert wird NUR bei einem solchen Rest; ein echter Anlegen-Entwurf
 * ueberlebt ein versehentliches Escape weiter. clearQuestForm() blendet auch
 * die Markdown-Knoepfe aus, die sonst den alten Eintrag exportierten.
 *
 * Ist das Formular OFFEN, ist #edit-quest-id kein Rest, sondern die laufende
 * Bearbeitung — dann tut der Weg nichts (wie showNewNPCModal()). Gemessen
 * erreichen Taste n (Fokus auf BODY nach einem Klick auf eine Beschriftung)
 * und die Befehlspalette diesen Weg bei offenem ✏️.
 */
function showNewQuestModal() {
    if ($('quest-modal')?.classList.contains('show')) return;
    if ($('edit-quest-id')?.value) clearQuestForm();
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
            'edit-quest-id',
            'quest-title',
            'quest-giver',
            'quest-location',
            'quest-target',
            'quest-reward-gold',
            'quest-reward-other',
            'quest-reward-item'
        ],
        selectFields: [{ id: 'quest-type', defaultValue: 'quest' }],
        contentEditableFields: ['quest-desc', 'quest-epilog'],
        checkboxFields: ['quest-completed', 'quest-rewarded'],
        customHandlers: () => {
            const itemsList = $('quest-reward-items-list');
            if (itemsList) itemsList.innerHTML = '';

            // Hide markdown export/import buttons for new quests
            const markdownActions = $('quest-markdown-actions');
            if (markdownActions) {
                markdownActions.style.display = 'none';
            }
        }
    });
}
function populateQuestSelects() {
    const D = window.D;
    // NPC dropdown for quest giver
    const giverSelect = $('quest-giver');
    if (giverSelect) {
        const currentValue = giverSelect.value;
        giverSelect.innerHTML =
            '<option value="">-- NPC wählen --</option>' +
            D.npcs
                .map(
                    n =>
                        `<option value="${n.id}">${esc(n.name)}${n.role ? ` (${esc(n.role)})` : ''}</option>`
                )
                .join('');
        giverSelect.value = currentValue;
    }
    // Location dropdown
    const locationSelect = $('quest-location');
    if (locationSelect) {
        const currentValue = locationSelect.value;
        locationSelect.innerHTML =
            '<option value="">-- Ort wählen --</option>' +
            D.locations.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('');
        locationSelect.value = currentValue;
    }
    // Target location dropdown
    const targetSelect = $('quest-target');
    if (targetSelect) {
        const currentValue = targetSelect.value;
        targetSelect.innerHTML =
            '<option value="">-- Zielort wählen --</option>' +
            D.locations.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('');
        targetSelect.value = currentValue;
    }
    // Items from loot for reward
    const itemSelect = $('quest-reward-item');
    if (itemSelect) {
        itemSelect.innerHTML =
            '<option value="">-- Item wählen --</option>' +
            D.loot
                .map(
                    i =>
                        `<option value="${i.id}" data-name="${esc(i.name)}">${esc(i.name)}${i.quantity > 1 ? ` (${i.quantity}x)` : ''}</option>`
                )
                .join('');
    }
}
function addQuestRewardItem() {
    const select = $('quest-reward-item');
    if (!select || !select.value) return;
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
window.saveQuest = saveQuest;
window.editQuest = editQuest;
window.deleteQuest = deleteQuest;
window.populateQuestSelects = populateQuestSelects;
window.addQuestRewardItem = addQuestRewardItem;
// Verbraucher: features/command-palette/action-registry.js ("Neue Quest").
window.showNewQuestModal = showNewQuestModal;
