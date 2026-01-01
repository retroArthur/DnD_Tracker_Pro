// ============================================================
// NPC CRUD - Create, Read, Update, Delete Operationen
// ============================================================
// Extrahiert aus features/render-npcs.js

function saveNPC() {
    const id = $('edit-npc-id').value;

    // Collect triggers
    const triggers = [];
    $('npc-triggers-container').querySelectorAll('.npc-trigger-field').forEach(div => {
        const cond = div.querySelector('.trigger-cond')?.value?.trim() || '';
        const rev = div.querySelector('.trigger-reveal')?.value?.trim() || '';
        if (cond && rev) triggers.push({ condition: cond, reveal: rev, triggered: false });
    });

    // Collect dialogs
    const dialogs = [];
    $('npc-dialogs-container').querySelectorAll('.npc-dialog-field').forEach(div => {
        const title = div.querySelector('.dialog-title')?.value?.trim() || '';
        const trigger = div.querySelector('.dialog-trigger')?.value?.trim() || '';
        const textEl = div.querySelector('.dialog-text');
        const text = textEl ? sanitizeHTML(textEl.innerHTML) : '';
        if (text) dialogs.push({ title, triggerCondition: trigger, text, used: false });
    });

    const npc = {
        name: $('npc-name').value.trim(),
        role: $('npc-role').value.trim(),
        race: $('npc-race').value,
        locationId: parseInt($('npc-location').value) || null,
        chapter: $('npc-chapter').value.trim(),
        filterId: parseInt($('npc-filter').value) || null,
        quests: $('npc-quests').value.split(',').map(s => s.trim()).filter(Boolean),
        info: $('npc-info').value.split(',').map(s => s.trim()).filter(Boolean),
        relationships: $('npc-relations').value.split(',').map(s => s.trim()).filter(Boolean),
        description: sanitizeHTML($('npc-desc').innerHTML),
        triggers,
        dialogs
    };

    if (!npc.name) { showToast('⚠️ Name erforderlich', 'error'); return; }

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
    }
    else {
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
 * Oeffnet das Bearbeitungsmodal fuer einen NPC
 * @param {number|string} id - NPC ID
 */
function editNPC(id) {
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
    $('edit-npc-id').value = numId;
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
    $('npc-triggers-container').innerHTML = '';
    (n.triggers || []).forEach(t => {
        addTriggerField();
        const divs = $('npc-triggers-container').querySelectorAll('.npc-trigger-field');
        const last = divs[divs.length - 1];
        if (last) {
            const condEl = last.querySelector('.trigger-cond');
            const revEl = last.querySelector('.trigger-reveal');
            if (condEl) condEl.value = t.condition || '';
            if (revEl) revEl.value = t.reveal || '';
        }
    });

    // Load dialogs
    $('npc-dialogs-container').innerHTML = '';
    resetDialogFieldCounter();
    (n.dialogs || []).forEach(d => {
        addDialogField();
        const divs = $('npc-dialogs-container').querySelectorAll('.npc-dialog-field');
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

    showModal('npc-modal');
}

/**
 * Loescht einen NPC nach Bestaetigung
 * @param {number|string} id - NPC ID
 */
function deleteNPC(id) {
    const numId = parseEntityId(id);
    if (numId === null) return;

    const npc = EntityLookup.npc(id);
    if (confirm(`NPC "${npc?.name || 'Unbekannt'}" löschen?`)) {
        pushUndo('NPC gelöscht');
        D.npcs = D.npcs.filter(n => n.id !== numId);
        renderLocations();
        renderNPCList();
        save();
    }
}

function clearNPCForm() {
    $('edit-npc-id').value = '';
    ['npc-name', 'npc-role', 'npc-race', 'npc-location', 'npc-chapter', 'npc-filter', 'npc-quests', 'npc-info', 'npc-relations'].forEach(id => { if ($(id)) $(id).value = ''; });
    $('npc-desc').innerHTML = '';
    $('npc-triggers-container').innerHTML = '';
    $('npc-dialogs-container').innerHTML = '';
    resetDialogFieldCounter();
}
