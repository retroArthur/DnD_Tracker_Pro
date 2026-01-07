// [SECTION:CONDITIONS]
// ============================================================
// CONDITIONS SYSTEM - @condition @status @debuff @buff
// ============================================================

import { $ } from '@utils/basic';
import { parseEntityId, showToast } from '@utils/utilities';

export function showConditionsModal(type: string, id: number): void {
    const typeEl = $('condition-target-type') as HTMLInputElement;
    const idEl = $('condition-target-id') as HTMLInputElement;
    if (typeEl) typeEl.value = type;
    if (idEl) idEl.value = String(id);
    renderConditionsList();
    const showModal = (window as any).showModal;
    if (showModal) showModal('conditions-modal');
}

export function renderConditionsList(): void {
    const c = $('conditions-list');
    if (!c) return;

    const typeEl = $('condition-target-type') as HTMLInputElement;
    const idEl = $('condition-target-id') as HTMLInputElement;
    const type = typeEl?.value;
    const id = parseEntityId(idEl?.value);

    const getEntityByTypeAndId = (window as any).getEntityByTypeAndId;
    const entity = getEntityByTypeAndId(type, id);
    const currentConditions = entity?.conditions || [];

    const CONDITIONS = (window as any).CONDITIONS;
    c.innerHTML = Object.entries(CONDITIONS).map(([key, cond]: [string, any]) => {
        const hasCondition = currentConditions.some((c: any) => c.type === key);
        return `<button class="btn ${hasCondition ? 'btn-success' : ''}" data-action="toggle-condition" data-value="${key}" style="justify-content: flex-start; gap: 8px; padding: 10px 12px; min-width: 0; overflow: hidden;">
            <span style="flex-shrink: 0;">${cond.icon}</span>
            <span style="flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cond.name}</span>
            ${hasCondition ? '<span style="flex-shrink: 0;">✓</span>' : ''}
        </button>`;
    }).join('');
}

export function toggleCondition(conditionKey: string): void {
    const typeEl = $('condition-target-type') as HTMLInputElement;
    const idEl = $('condition-target-id') as HTMLInputElement;
    const type = typeEl?.value;
    const id = parseEntityId(idEl?.value);

    const getEntityByTypeAndId = (window as any).getEntityByTypeAndId;
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return;

    if (!entity.conditions) entity.conditions = [];

    const idx = entity.conditions.findIndex((c: any) => c.type === conditionKey);
    if (idx > -1) {
        entity.conditions.splice(idx, 1);
    } else {
        const CONDITIONS = (window as any).CONDITIONS;
        entity.conditions.push({
            type: conditionKey,
            name: CONDITIONS[conditionKey].name,
            addedAt: Date.now()
        });
    }

    renderConditionsList();
    const renderParty = (window as any).renderParty;
    const renderInit = (window as any).renderInit;
    const save = (window as any).save;
    if (renderParty) renderParty();
    if (renderInit) renderInit();
    if (save) save();
}

export function addCustomCondition(): void {
    const nameEl = $('custom-condition-name') as HTMLInputElement;
    const name = nameEl?.value.trim();
    if (!name) return;

    const typeEl = $('condition-target-type') as HTMLInputElement;
    const idEl = $('condition-target-id') as HTMLInputElement;
    const type = typeEl?.value;
    const id = parseEntityId(idEl?.value);

    const getEntityByTypeAndId = (window as any).getEntityByTypeAndId;
    const entity = getEntityByTypeAndId(type, id);
    if (!entity) return;

    if (!entity.conditions) entity.conditions = [];
    entity.conditions.push({
        type: 'custom',
        name: name,
        addedAt: Date.now()
    });

    if (nameEl) nameEl.value = '';
    const hideModal = (window as any).hideModal;
    const renderParty = (window as any).renderParty;
    const renderInit = (window as any).renderInit;
    const save = (window as any).save;
    if (hideModal) hideModal('conditions-modal');
    if (renderParty) renderParty();
    if (renderInit) renderInit();
    if (save) save();
    showToast(`Zustand "${name}" hinzugefügt`);
}

export function removeCondition(type: string, id: number, conditionIndex: number): void {
    const getEntityByTypeAndId = (window as any).getEntityByTypeAndId;
    const entity = getEntityByTypeAndId(type, id);
    if (!entity || !entity.conditions) return;

    entity.conditions.splice(conditionIndex, 1);
    const renderParty = (window as any).renderParty;
    const renderInit = (window as any).renderInit;
    const save = (window as any).save;
    if (renderParty) renderParty();
    if (renderInit) renderInit();
    if (save) save();
}

export function renderConditionsBar(conditions: any[], type: string, id: number): string {
    if (!conditions || !conditions.length) return '';

    const CONDITIONS = (window as any).CONDITIONS;
    const esc = (window as any).esc;

    return `<div class="conditions-bar">
        ${conditions.map((c: any, i: number) => {
            const cond = CONDITIONS[c.type] || { icon: '⚡', name: c.name };
            return `<span class="condition-tag condition-${c.type}" title="${esc(cond.desc || c.name)}" data-action="remove-condition-stop" data-type="${type}" data-id="${id}" data-value="${i}">
                ${cond.icon} ${esc(c.name || cond.name)}
                <span class="remove-condition">✕</span>
            </span>`;
        }).join('')}
    </div>`;
}

// ============================================================
