// [SECTION:RENDER_LOOT]
// ============================================================
// LOOT - @items @inventory @treasure
// ============================================================

import { $, esc } from '@utils/basic';
import { showToast, parseEntityId } from '@utils/utilities';
import { save } from '@systems/spellslots/persistence';
import { EntityLookup } from '@render/helpers';
import { showModal, hideModal } from '@systems/spellslots/navigation';

export function showAssignItems(charId: number | string): void {
    const ch = EntityLookup.character(charId);
    if (!ch) return;

    const charIdInput = $('assign-item-char-id') as HTMLInputElement;
    const searchInput = $('assign-item-search') as HTMLInputElement;
    const catFilterInput = $('assign-item-cat-filter') as HTMLSelectElement;

    if (charIdInput) charIdInput.value = String(charId);
    if (searchInput) searchInput.value = '';
    if (catFilterInput) catFilterInput.value = '';

    renderAssignItemList();
    showModal('assign-item-modal');
}

export function renderAssignItemList(): void {
    const D = (window as any).D;
    const CATS = (window as any).CATS;
    const RARITY_COLORS = (window as any).RARITY_COLORS;

    const container = $('assign-item-list');
    if (!container) return;

    const charIdInput = $('assign-item-char-id') as HTMLInputElement;
    const charId = parseEntityId(charIdInput?.value);
    if (charId === null) {
        container.innerHTML = '<div style="color:var(--text-dim);">Charakter nicht gefunden</div>';
        return;
    }
    const ch = EntityLookup.character(charId);
    if (!ch) {
        container.innerHTML = '<div style="color:var(--text-dim);">Charakter nicht gefunden</div>';
        return;
    }

    const searchInput = $('assign-item-search') as HTMLInputElement | null;
    const catFilterInput = $('assign-item-cat-filter') as HTMLSelectElement | null;

    const searchTerm = (searchInput?.value || '').toLowerCase().trim();
    const catFilter = catFilterInput?.value || '';

    let items = D.loot || [];

    // Filter by category
    if (catFilter) {
        items = items.filter((i: any) => i.category === catFilter);
    }

    // Filter by search
    if (searchTerm) {
        items = items.filter((i: any) => {
            const name = (i.name || '').toLowerCase();
            const desc = (i.description || '').toLowerCase();
            return name.includes(searchTerm) || desc.includes(searchTerm);
        });
    }

    // Migrate old format (array of IDs) to new format (array of objects with quantity)
    if (!ch.items) ch.items = [];
    if (ch.items.length > 0 && typeof ch.items[0] === 'number') {
        ch.items = ch.items.map((id: number) => ({ id: id, quantity: 1 }));
    }

    // Get assigned item quantities
    const getAssignedQuantity = (itemId: number): number => {
        const assigned = ch.items.find((i: any) => i.id === itemId);
        return assigned ? assigned.quantity : 0;
    };

    // Sort: assigned first, then by name
    items.sort((a: any, b: any) => {
        const aAssigned = getAssignedQuantity(a.id) > 0;
        const bAssigned = getAssignedQuantity(b.id) > 0;
        if (aAssigned && !bAssigned) return -1;
        if (!aAssigned && bAssigned) return 1;
        return (a.name || '').localeCompare(b.name || '');
    });

    if (!items.length) {
        container.innerHTML = '<div style="color:var(--text-dim); text-align:center; padding:20px;">Keine Items gefunden. Füge Items in der Truhe hinzu.</div>';
        updateAssignItemCount();
        return;
    }

    // Uses RARITY_COLORS from constants.js
    container.innerHTML = items.map((i: any) => {
        const assignedQty = getAssignedQuantity(i.id);
        const maxQty = i.quantity || 1;
        const catIcon = CATS[i.category]?.split(' ')[0] || '📦';
        const rarityColor = RARITY_COLORS[i.rarity] || RARITY_COLORS.normal;

        return `<div class="assign-item-row" style="display:grid; grid-template-columns: 1fr auto; align-items:center; gap:10px; padding:8px 10px; border-radius:6px; margin-bottom:2px; ${assignedQty > 0 ? 'background:rgba(74,222,128,0.15);' : ''}" data-item-id="${i.id}">
            <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
                <span style="font-size:1.1em; flex-shrink:0;">${catIcon}</span>
                <span style="color:${rarityColor}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(i.name)}</span>
                <span style="font-size:0.8em; color:var(--text-dim); flex-shrink:0;">(${maxQty} verf.)</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                <button class="btn btn-sm" data-action="change-assign-qty" data-id="${i.id}" data-value="-1" style="padding:4px 8px; font-size:1.1em;">−</button>
                <input type="number" class="assign-item-qty" data-item-id="${i.id}" value="${assignedQty}" min="0" max="${maxQty}"
                       style="width:50px; text-align:center; padding:4px; background:var(--bg-card); border:1px solid var(--border); border-radius:4px; color:var(--text);"
                       data-on-change="validateAssignItemQty" data-max-qty="${maxQty}">
                <button class="btn btn-sm" data-action="change-assign-qty" data-id="${i.id}" data-value="1" style="padding:4px 8px; font-size:1.1em;">+</button>
            </div>
        </div>`;
    }).join('');

    updateAssignItemCount();
}

export function changeAssignItemQty(itemId: number | string, delta: number | string): void {
    const id = typeof itemId === 'string' ? parseInt(itemId) : itemId;
    const deltaNum = typeof delta === 'string' ? parseInt(delta) : delta;

    const input = document.querySelector(`.assign-item-qty[data-item-id="${id}"]`) as HTMLInputElement | null;
    if (!input) return;

    const max = parseInt(input.max) || 99;
    const current = parseInt(input.value) || 0;
    const newVal = Math.max(0, Math.min(max, current + deltaNum));
    input.value = String(newVal);

    // Update row highlight
    const row = input.closest('.assign-item-row') as HTMLElement | null;
    if (row) {
        row.style.background = newVal > 0 ? 'rgba(74,222,128,0.15)' : '';
    }

    updateAssignItemCount();
}

export function validateAssignItemQty(input: any, max?: number): void {
    // Supports both direct arguments and element (from data-on-change)
    if (max === undefined && input && input.dataset) {
        max = parseInt(input.dataset.maxQty, 10) || 99;
    }

    let val = parseInt(input.value) || 0;
    val = Math.max(0, Math.min(max || 99, val));
    input.value = String(val);

    // Update row highlight
    const row = input.closest('.assign-item-row') as HTMLElement | null;
    if (row) {
        row.style.background = val > 0 ? 'rgba(74,222,128,0.15)' : '';
    }

    updateAssignItemCount();
}

function updateAssignItemCount(): void {
    const inputs = document.querySelectorAll('.assign-item-qty') as NodeListOf<HTMLInputElement>;
    let totalItems = 0;
    let uniqueItems = 0;

    inputs.forEach(input => {
        const qty = parseInt(input.value) || 0;
        if (qty > 0) {
            uniqueItems++;
            totalItems += qty;
        }
    });

    const countEl = $('assign-item-count');
    if (countEl) countEl.textContent = `(${uniqueItems} Items, ${totalItems} Stück)`;
}

export function assignItems(): void {
    const D = (window as any).D;
    const renderParty = (window as any).renderParty;
    const showCharacterDetails = (window as any).showCharacterDetails;

    const charIdInput = $('assign-item-char-id') as HTMLInputElement;
    const charId = parseEntityId(charIdInput?.value);
    if (charId === null) {
        showToast('⚠️ Charakter nicht gefunden', 'error');
        return;
    }
    const ch = EntityLookup.character(charId);
    if (!ch) {
        showToast('⚠️ Charakter nicht gefunden', 'error');
        return;
    }

    const inputs = document.querySelectorAll('.assign-item-qty') as NodeListOf<HTMLInputElement>;
    const newItems: Array<{ id: number; quantity: number }> = [];

    // Collect all item IDs currently visible in the filtered list
    const visibleItemIds = new Set<number>();

    inputs.forEach(input => {
        const itemId = parseInt(input.dataset.itemId || '0');
        const qty = parseInt(input.value) || 0;
        visibleItemIds.add(itemId);

        // Check if item exists
        if (qty > 0 && D.loot.some((l: any) => l.id === itemId)) {
            newItems.push({ id: itemId, quantity: qty });
        }
    });

    // Keep items that were not in the filtered list (when filter is active)
    const searchInput = $('assign-item-search') as HTMLInputElement | null;
    const catFilterInput = $('assign-item-cat-filter') as HTMLSelectElement | null;

    const searchTerm = (searchInput?.value || '').trim();
    const catFilter = catFilterInput?.value || '';

    if (searchTerm || catFilter) {
        // Filter is active - keep non-visible items
        (ch.items || []).forEach((existingItem: any) => {
            const itemObj = typeof existingItem === 'number'
                ? { id: existingItem, quantity: 1 }
                : existingItem;

            if (!visibleItemIds.has(itemObj.id)) {
                // Item was not in filtered list - keep it
                if (D.loot.some((l: any) => l.id === itemObj.id)) {
                    newItems.push(itemObj);
                }
            }
        });
    }

    ch.items = newItems;

    // Save and update UI
    save();
    hideModal('assign-item-modal');
    renderParty();

    // If character detail modal is open, update it
    const charDetailModal = $('char-detail-modal');
    if (charDetailModal?.classList.contains('show')) {
        showCharacterDetails(charId);
    }

    const totalQty = newItems.reduce((sum, i) => sum + i.quantity, 0);
    showToast(`📦 ${newItems.length} Items (${totalQty} Stück) zugewiesen`);
}

// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================

(window as any).showAssignItems = showAssignItems;
(window as any).renderAssignItemList = renderAssignItemList;
(window as any).changeAssignItemQty = changeAssignItemQty;
(window as any).validateAssignItemQty = validateAssignItemQty;
(window as any).assignItems = assignItems;
