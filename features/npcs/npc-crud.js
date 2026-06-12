// [SECTION:NPC_CRUD]
// ============================================================
// NPC CRUD - @create @edit @delete @save
// ============================================================
/**
 * Saves an NPC (create or update)
 */
function saveNPC() {
    const D = window.D;
    const validateAndShowErrors = window.validateAndShowErrors;
    const renderLocations = window.renderLocations;
    const renderNPCList = window.renderNPCList;
    const log = window.log;
    const idInput = $('edit-npc-id');
    const id = idInput.value;
    // Collect triggers
    const triggers = [];
    const triggersContainer = $('npc-triggers-container');
    if (triggersContainer) {
        triggersContainer.querySelectorAll('.npc-trigger-field').forEach(div => {
            const condEl = div.querySelector('.trigger-cond');
            const revEl = div.querySelector('.trigger-reveal');
            const cond = condEl?.value?.trim() || '';
            const rev = revEl?.value?.trim() || '';
            if (cond && rev) triggers.push({ condition: cond, reveal: rev, triggered: false });
        });
    }
    // Collect dialogs
    const dialogs = [];
    const dialogsContainer = $('npc-dialogs-container');
    if (dialogsContainer) {
        dialogsContainer.querySelectorAll('.npc-dialog-field').forEach(div => {
            const titleEl = div.querySelector('.dialog-title');
            const triggerEl = div.querySelector('.dialog-trigger');
            const textEl = div.querySelector('.dialog-text');
            const title = titleEl?.value?.trim() || '';
            const trigger = triggerEl?.value?.trim() || '';
            const text = textEl ? sanitizeHTML(textEl.innerHTML) : '';
            if (text) dialogs.push({ title, triggerCondition: trigger, text, used: false });
        });
    }
    const npc = {
        name: $('npc-name').value.trim(),
        role: $('npc-role').value.trim(),
        race: $('npc-race').value,
        locationId: parseInt($('npc-location').value) || null,
        chapter: $('npc-chapter').value.trim(),
        filterId: parseInt($('npc-filter').value) || null,
        quests: $('npc-quests')
            .value.split(',')
            .map(s => s.trim())
            .filter(Boolean),
        info: $('npc-info')
            .value.split(',')
            .map(s => s.trim())
            .filter(Boolean),
        relationships: $('npc-relations')
            .value.split(',')
            .map(s => s.trim())
            .filter(Boolean),
        description: sanitizeHTML($('npc-desc').innerHTML),
        triggers,
        dialogs
    };
    // Validate entity references and required fields
    if (!validateAndShowErrors(npc, 'npc')) return;
    pushUndo(id ? 'NPC bearbeitet' : 'NPC erstellt');
    if (id) {
        const idx = D.npcs.findIndex(n => n.id === parseEntityId(id));
        if (idx > -1) {
            // Preserve existing dialog/trigger states
            const existing = D.npcs[idx];
            if (existing.dialogs && npc.dialogs.length === 0) {
                npc.dialogs = existing.dialogs;
            }
            if (existing.triggers) {
                // Merge trigger states
                npc.triggers = npc.triggers.map((t, i) => ({
                    ...t,
                    triggered: existing.triggers[i]?.triggered || false
                }));
            }
            D.npcs[idx] = { ...D.npcs[idx], ...npc };
        }
    } else {
        npc.id = nextId('npcs');
        D.npcs.push(npc);
    }
    hideModal('npc-modal');
    clearNPCForm();
    renderLocations();
    renderNPCList();
    save();
    showToast(id ? 'NPC aktualisiert' : 'NPC hinzugefügt');
}
/**
 * Opens the edit modal for an NPC
 */
function editNPC(id) {
    const populateSelects = window.populateSelects;
    const addTriggerField = window.addTriggerField;
    const addDialogField = window.addDialogField;
    const resetDialogFieldCounter = window.resetDialogFieldCounter;
    const log = window.log;
    const numId = parseEntityId(id);
    if (numId === null) {
        log('editNPC: Ungueltige ID:', id);
        return;
    }
    const n = EntityLookup.npc(numId);
    if (!n) {
        log('editNPC: NPC nicht gefunden mit ID:', numId);
        showToast('NPC nicht gefunden', 'error');
        return;
    }
    // Zuerst Selects füllen
    populateSelects();
    // Dann Werte setzen
    $('edit-npc-id').value = String(numId);
    $('npc-name').value = n.name || '';
    $('npc-role').value = n.role || '';
    $('npc-race').value = n.race || '';
    $('npc-chapter').value = n.chapter || '';
    $('npc-quests').value = (n.quests || []).join(', ');
    $('npc-info').value = (n.info || []).join(', ');
    $('npc-relations').value = (n.relationships || []).join(', ');
    $('npc-desc').innerHTML = sanitizeHTML(n.description) || '';
    // Location und Filter nach kleiner Verzögerung setzen (damit Optionen geladen sind)
    setTimeout(() => {
        if (n.locationId) $('npc-location').value = String(n.locationId);
        if (n.filterId) $('npc-filter').value = String(n.filterId);
    }, 10);
    // Load triggers
    const triggersContainer = $('npc-triggers-container');
    if (triggersContainer) {
        triggersContainer.innerHTML = '';
        (n.triggers || []).forEach(t => {
            addTriggerField();
            const divs = triggersContainer.querySelectorAll('.npc-trigger-field');
            const last = divs[divs.length - 1];
            if (last) {
                const condEl = last.querySelector('.trigger-cond');
                const revEl = last.querySelector('.trigger-reveal');
                if (condEl) condEl.value = t.condition || '';
                if (revEl) revEl.value = t.reveal || '';
            }
        });
    }
    // Load dialogs
    const dialogsContainer = $('npc-dialogs-container');
    if (dialogsContainer) {
        dialogsContainer.innerHTML = '';
        resetDialogFieldCounter();
        (n.dialogs || []).forEach(d => {
            addDialogField();
            const divs = dialogsContainer.querySelectorAll('.npc-dialog-field');
            const last = divs[divs.length - 1];
            if (last) {
                const titleEl = last.querySelector('.dialog-title');
                const triggerEl = last.querySelector('.dialog-trigger');
                const textEl = last.querySelector('.dialog-text');
                if (titleEl) titleEl.value = d.title || '';
                if (triggerEl) triggerEl.value = d.triggerCondition || '';
                if (textEl) textEl.innerHTML = sanitizeHTML(d.text) || '';
            }
        });
    }

    // Show markdown export/import buttons when editing
    const markdownActions = $('npc-markdown-actions');
    if (markdownActions) {
        markdownActions.style.display = 'block';
    }

    showModal('npc-modal');
}
/**
 * Deletes an NPC after confirmation
 */
function deleteNPC(id) {
    const renderLocations = window.renderLocations;
    const renderNPCList = window.renderNPCList;
    deleteWithConfirm({
        entityType: 'npcs',
        id: id,
        confirmMessage: null, // Use default message
        undoLabel: 'NPC gelöscht',
        onSuccess: () => {
            renderLocations(); // NPCs can be linked to locations
            renderNPCList();
            showToast('✅ NPC gelöscht', 'success');
        }
    });
}
/**
 * Clears the NPC form
 */
function clearNPCForm() {
    const resetDialogFieldCounter = window.resetDialogFieldCounter;

    clearFormFields({
        textFields: [
            'edit-npc-id',
            'npc-name',
            'npc-role',
            'npc-race',
            'npc-location',
            'npc-chapter',
            'npc-filter',
            'npc-quests',
            'npc-info',
            'npc-relations'
        ],
        contentEditableFields: ['npc-desc'],
        customHandlers: () => {
            // Clear dynamic containers
            const triggersContainer = $('npc-triggers-container');
            if (triggersContainer) triggersContainer.innerHTML = '';

            const dialogsContainer = $('npc-dialogs-container');
            if (dialogsContainer) dialogsContainer.innerHTML = '';

            resetDialogFieldCounter();

            // Hide markdown export/import buttons for new NPCs
            const markdownActions = $('npc-markdown-actions');
            if (markdownActions) {
                markdownActions.style.display = 'none';
            }
        }
    });
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.saveNPC = saveNPC;
window.editNPC = editNPC;
window.deleteNPC = deleteNPC;
