// [SECTION:NPC_CRUD]
// ============================================================
// NPC CRUD - @create @edit @delete @save
// ============================================================

import { $, sanitizeHTML } from '@utils/basic';
import { showToast, nextId, parseEntityId } from '@utils/utilities';
import { pushUndo } from '@systems/undo';
import { save } from '@systems/spellslots/persistence';
import { showModal, hideModal } from '@systems/spellslots/navigation';
import { EntityLookup } from '@render/helpers';
import { deleteWithConfirm } from '@utils/crud-helpers';

/**
 * Saves an NPC (create or update)
 */
export function saveNPC(): void {
    const D = (window as any).D;
    const validateAndShowErrors = (window as any).validateAndShowErrors;
    const renderLocations = (window as any).renderLocations;
    const renderNPCList = (window as any).renderNPCList;
    const log = (window as any).log;

    const idInput = $('edit-npc-id') as HTMLInputElement;
    const id = idInput.value;

    // Collect triggers
    const triggers: Array<{ condition: string; reveal: string; triggered: boolean }> = [];
    const triggersContainer = $('npc-triggers-container');
    if (triggersContainer) {
        triggersContainer.querySelectorAll('.npc-trigger-field').forEach(div => {
            const condEl = div.querySelector('.trigger-cond') as HTMLInputElement | null;
            const revEl = div.querySelector('.trigger-reveal') as HTMLInputElement | null;
            const cond = condEl?.value?.trim() || '';
            const rev = revEl?.value?.trim() || '';
            if (cond && rev) triggers.push({ condition: cond, reveal: rev, triggered: false });
        });
    }

    // Collect dialogs
    const dialogs: Array<{ title: string; triggerCondition: string; text: string; used: boolean }> = [];
    const dialogsContainer = $('npc-dialogs-container');
    if (dialogsContainer) {
        dialogsContainer.querySelectorAll('.npc-dialog-field').forEach(div => {
            const titleEl = div.querySelector('.dialog-title') as HTMLInputElement | null;
            const triggerEl = div.querySelector('.dialog-trigger') as HTMLInputElement | null;
            const textEl = div.querySelector('.dialog-text') as HTMLElement | null;
            const title = titleEl?.value?.trim() || '';
            const trigger = triggerEl?.value?.trim() || '';
            const text = textEl ? sanitizeHTML(textEl.innerHTML) : '';
            if (text) dialogs.push({ title, triggerCondition: trigger, text, used: false });
        });
    }

    const npc: any = {
        name: ($('npc-name') as HTMLInputElement).value.trim(),
        role: ($('npc-role') as HTMLInputElement).value.trim(),
        race: ($('npc-race') as HTMLSelectElement).value,
        locationId: parseInt(($('npc-location') as HTMLSelectElement).value) || null,
        chapter: ($('npc-chapter') as HTMLInputElement).value.trim(),
        filterId: parseInt(($('npc-filter') as HTMLSelectElement).value) || null,
        quests: ($('npc-quests') as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean),
        info: ($('npc-info') as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean),
        relationships: ($('npc-relations') as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean),
        description: sanitizeHTML(($('npc-desc') as HTMLElement).innerHTML),
        triggers,
        dialogs
    };

    // Validate entity references and required fields
    if (!validateAndShowErrors(npc, 'npc')) return;

    pushUndo(id ? 'NPC bearbeitet' : 'NPC erstellt');

    if (id) {
        const idx = D.npcs.findIndex((n: any) => n.id === parseEntityId(id));
        if (idx > -1) {
            // Preserve existing dialog/trigger states
            const existing = D.npcs[idx];
            if (existing.dialogs && npc.dialogs.length === 0) {
                npc.dialogs = existing.dialogs;
            }
            if (existing.triggers) {
                // Merge trigger states
                npc.triggers = npc.triggers.map((t: any, i: number) => ({
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
export function editNPC(id: number | string): void {
    const populateSelects = (window as any).populateSelects;
    const addTriggerField = (window as any).addTriggerField;
    const addDialogField = (window as any).addDialogField;
    const resetDialogFieldCounter = (window as any).resetDialogFieldCounter;
    const log = (window as any).log;

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
    ($('edit-npc-id') as HTMLInputElement).value = String(numId);
    ($('npc-name') as HTMLInputElement).value = n.name || '';
    ($('npc-role') as HTMLInputElement).value = n.role || '';
    ($('npc-race') as HTMLSelectElement).value = n.race || '';
    ($('npc-chapter') as HTMLInputElement).value = n.chapter || '';
    ($('npc-quests') as HTMLInputElement).value = (n.quests || []).join(', ');
    ($('npc-info') as HTMLInputElement).value = (n.info || []).join(', ');
    ($('npc-relations') as HTMLInputElement).value = (n.relationships || []).join(', ');
    ($('npc-desc') as HTMLElement).innerHTML = sanitizeHTML(n.description) || '';

    // Location und Filter nach kleiner Verzögerung setzen (damit Optionen geladen sind)
    setTimeout(() => {
        if (n.locationId) ($('npc-location') as HTMLSelectElement).value = String(n.locationId);
        if (n.filterId) ($('npc-filter') as HTMLSelectElement).value = String(n.filterId);
    }, 10);

    // Load triggers
    const triggersContainer = $('npc-triggers-container');
    if (triggersContainer) {
        triggersContainer.innerHTML = '';
        (n.triggers || []).forEach((t: any) => {
            addTriggerField();
            const divs = triggersContainer.querySelectorAll('.npc-trigger-field');
            const last = divs[divs.length - 1];
            if (last) {
                const condEl = last.querySelector('.trigger-cond') as HTMLInputElement | null;
                const revEl = last.querySelector('.trigger-reveal') as HTMLInputElement | null;
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
        (n.dialogs || []).forEach((d: any) => {
            addDialogField();
            const divs = dialogsContainer.querySelectorAll('.npc-dialog-field');
            const last = divs[divs.length - 1];
            if (last) {
                const titleEl = last.querySelector('.dialog-title') as HTMLInputElement | null;
                const triggerEl = last.querySelector('.dialog-trigger') as HTMLInputElement | null;
                const textEl = last.querySelector('.dialog-text') as HTMLElement | null;
                if (titleEl) titleEl.value = d.title || '';
                if (triggerEl) triggerEl.value = d.triggerCondition || '';
                if (textEl) textEl.innerHTML = sanitizeHTML(d.text) || '';
            }
        });
    }

    showModal('npc-modal');
}

/**
 * Deletes an NPC after confirmation
 */
export function deleteNPC(id: number | string): void {
    const renderLocations = (window as any).renderLocations;
    const renderNPCList = (window as any).renderNPCList;

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
export function clearNPCForm(): void {
    const resetDialogFieldCounter = (window as any).resetDialogFieldCounter;

    ($('edit-npc-id') as HTMLInputElement).value = '';

    ['npc-name', 'npc-role', 'npc-race', 'npc-location', 'npc-chapter', 'npc-filter',
     'npc-quests', 'npc-info', 'npc-relations'].forEach(id => {
        const el = $(id) as HTMLInputElement | HTMLSelectElement | null;
        if (el) el.value = '';
    });

    const descEl = $('npc-desc') as HTMLElement | null;
    if (descEl) descEl.innerHTML = '';

    const triggersContainer = $('npc-triggers-container');
    if (triggersContainer) triggersContainer.innerHTML = '';

    const dialogsContainer = $('npc-dialogs-container');
    if (dialogsContainer) dialogsContainer.innerHTML = '';

    resetDialogFieldCounter();
}

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================

(window as any).saveNPC = saveNPC;
(window as any).editNPC = editNPC;
(window as any).deleteNPC = deleteNPC;
(window as any).clearNPCForm = clearNPCForm;
