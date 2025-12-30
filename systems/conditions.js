// [SECTION:CONDITIONS]
// ============================================================
// CONDITIONS SYSTEM - @condition @status @debuff @buff
// ============================================================
function showConditionsModal(type, id) {
    $('condition-target-type').value = type;
    $('condition-target-id').value = id;
    renderConditionsList();
    showModal('conditions-modal');
}

function renderConditionsList() {
    const c = $('conditions-list'); if (!c) return;
    const type = $('condition-target-type').value;
    const id = parseEntityId($('condition-target-id').value);
    
    const entity = getEntityByTypeAndId(type, id);
    const currentConditions = entity?.conditions || [];
    
    c.innerHTML = Object.entries(CONDITIONS).map(([key, cond]) => {
        const hasCondition = currentConditions.some(c => c.type === key);
        return `<button class="btn ${hasCondition ? 'btn-success' : ''}" data-action="toggle-condition" data-value="${key}" style="justify-content: flex-start; gap: 8px; padding: 10px 12px; min-width: 0; overflow: hidden;">
            <span style="flex-shrink: 0;">${cond.icon}</span>
            <span style="flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cond.name}</span>
            ${hasCondition ? '<span style="flex-shrink: 0;">✓</span>' : ''}
        </button>`;
    }).join('');
}

function toggleCondition(conditionKey) {
    const type = $('condition-target-type').value;
    const id = parseEntityId($('condition-target-id').value);
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return;
    
    if (!entity.conditions) entity.conditions = [];
    
    const idx = entity.conditions.findIndex(c => c.type === conditionKey);
    if (idx > -1) {
        entity.conditions.splice(idx, 1);
    } else {
        entity.conditions.push({ 
            type: conditionKey, 
            name: CONDITIONS[conditionKey].name,
            addedAt: Date.now()
        });
    }
    
    renderConditionsList();
    renderParty();
    renderInit();
    save();
}

function addCustomCondition() {
    const name = $('custom-condition-name').value.trim();
    if (!name) return;
    
    const type = $('condition-target-type').value;
    const id = parseEntityId($('condition-target-id').value);
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return;
    
    if (!entity.conditions) entity.conditions = [];
    entity.conditions.push({ 
        type: 'custom', 
        name: name,
        addedAt: Date.now()
    });
    
    $('custom-condition-name').value = '';
    hideModal('conditions-modal');
    renderParty();
    renderInit();
    save();
    showToast(`Zustand "${name}" hinzugefügt`);
}

function removeCondition(type, id, conditionIndex) {
    const entity = getEntityByTypeAndId(type, id);
    if (!entity || !entity.conditions) return;
    
    entity.conditions.splice(conditionIndex, 1);
    renderParty();
    renderInit();
    save();
}

function renderConditionsBar(conditions, type, id) {
    if (!conditions || !conditions.length) return '';
    return `<div class="conditions-bar">
        ${conditions.map((c, i) => {
            const cond = CONDITIONS[c.type] || { icon: '⚡', name: c.name };
            return `<span class="condition-tag condition-${c.type}" title="${esc(cond.desc || c.name)}" data-action="remove-condition-stop" data-type="${type}" data-id="${id}" data-value="${i}">
                ${cond.icon} ${esc(c.name || cond.name)}
                <span class="remove-condition">✕</span>
            </span>`;
        }).join('')}
    </div>`;
}

// ============================================================