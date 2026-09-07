// [SECTION:INITIATIVE_LOOT]
// ============================================================
// LOOT SYSTEM — Master-Detail Layout (aus features/initiative.js ausgelagert, MAINT-01 13-10)
// Analog: features/initiative-mob.js (Kopf-/Exportblock-Konvention)
// Konstanten: CATS, RARITY_COLORS, RARITY_LABELS, ORIGIN_LABELS, LOOT_TAG_LABELS (core/constants.js)
// ============================================================

// ============================================================
// LOOT SYSTEM (Master-Detail Layout)
// ============================================================
let selectedLootId = null;
let currentLootFilter = 'all';
// Alias für Kompatibilität
function renderLoot() {
    renderLootList();
}
function renderLootList() {
    const listContainer = $('loot-list');
    const filterContainer = $('loot-filters');
    if (!listContainer) return;
    const D = window.D;
    // Update counter
    window.setViewCount('loot', D.loot?.length || 0);
    // Render filter chips (by category)
    if (filterContainer) {
        filterContainer.innerHTML = `
            <div class="loot-filter-chip ${currentLootFilter === 'all' ? 'active' : ''}" data-action="set-loot-filter" data-value="all">Alle</div>
            ${Object.entries(CATS)
                .map(
                    ([k, v]) => `
                <div class="loot-filter-chip ${currentLootFilter === k ? 'active' : ''}"
                     data-action="set-loot-filter" data-value="${k}">
                    ${v}
                </div>
            `
                )
                .join('')}
        `;
    }
    // Get search and filter
    const searchInput = $('loot-search');
    const search = (searchInput?.value || '').toLowerCase();
    let items = [...(D.loot || [])];
    // Apply category filter
    if (currentLootFilter !== 'all') {
        items = items.filter(i => i.category === currentLootFilter);
    }
    // Apply search
    if (search) {
        items = items.filter(
            i =>
                (i.name || '').toLowerCase().includes(search) ||
                (i.description || '').toLowerCase().includes(search) ||
                (i.special || '').toLowerCase().includes(search) ||
                (i.property || '').toLowerCase().includes(search) ||
                (i.tags || []).some(t => t.toLowerCase().includes(search))
        );
    }
    // Sort by name
    items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    // Empty state
    if (!items.length) {
        listContainer.innerHTML = `
            <div class="loot-detail-empty" style="padding: 40px;">
                <div class="loot-detail-empty-icon">📦</div>
                <div class="loot-detail-empty-text">${search || currentLootFilter !== 'all' ? 'Keine Treffer' : 'Truhe ist leer'}</div>
                ${
                    !search && currentLootFilter === 'all'
                        ? `
                    <button class="loot-add-btn" data-action="show-modal" data-value="loot-modal" style="margin-top: 12px;">
                        + Item hinzufügen
                    </button>
                `
                        : ''
                }
            </div>
        `;
        clearLootDetail();
        return;
    }
    // Render list items
    listContainer.innerHTML = items.map(item => renderLootItem(item)).join('');
    // Auto-select first if none selected
    if (!selectedLootId || !items.find(i => i.id === selectedLootId)) {
        selectLoot(items[0].id, false);
    } else {
        showLootDetail(selectedLootId);
    }
}
function renderLootItem(item) {
    const catIcon = CATS[item.category]?.split(' ')[0] || '📦';
    const isSelected = item.id === selectedLootId;
    const rarity = item.rarity || 'normal';
    const rarityColor = RARITY_COLORS[rarity] || RARITY_COLORS.normal;
    const depleted = item.quantity <= 0;
    return `
        <div class="loot-item ${isSelected ? 'selected' : ''} ${depleted ? 'depleted' : ''}" data-action="select-loot" data-id="${item.id}">
            <div class="loot-item-icon">${catIcon}</div>
            <div class="loot-item-info">
                <div class="loot-item-name" style="color: ${rarityColor};">
                    ${esc(item.name)}
                    ${rarity !== 'normal' ? `<span class="loot-item-tag" style="background: ${rarityColor}; color: var(--bg-dark);">${RARITY_LABELS[rarity]}</span>` : ''}
                </div>
                <div class="loot-item-meta">
                    ×${item.quantity} • ${((item.value || 0) * item.quantity).toFixed(0)} GM
                </div>
            </div>
            <div class="loot-item-badges">
                ${(item.tags || []).includes('attunement') ? '<span class="loot-badge" title="Einstimmung">🔮</span>' : ''}
            </div>
        </div>
    `;
}
function selectLoot(id, scroll = true) {
    selectedLootId = id;
    // Update selection in list
    document.querySelectorAll('.loot-item').forEach(el => {
        el.classList.toggle('selected', el.dataset.id === String(id));
    });
    // Show detail
    showLootDetail(id);
    // Scroll into view if needed
    if (scroll) {
        const el = document.querySelector(`.loot-item[data-id="${id}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}
function showLootDetail(id) {
    const panel = $('loot-detail-panel');
    if (!panel) return;
    const item = EntityLookup.lootItem(id);
    if (!item) {
        clearLootDetail();
        return;
    }
    const catIcon = CATS[item.category]?.split(' ')[0] || '📦';
    const rarity = item.rarity || 'normal';
    const rarityColor = RARITY_COLORS[rarity] || RARITY_COLORS.normal;
    const totalValue = (item.value || 0) * Math.max(0, item.quantity);
    panel.innerHTML = `
        <div class="loot-detail-content">
            <div class="loot-detail-header">
                <div class="loot-detail-icon">${catIcon}</div>
                <div class="loot-detail-title">
                    <div class="loot-detail-name" style="color: ${rarityColor};">${esc(item.name)}</div>
                    <div class="loot-detail-subtitle">${CATS[item.category] || 'Sonstiges'} • ${RARITY_LABELS[rarity]}</div>
                </div>
                <div class="loot-detail-actions">
                    <button class="loot-detail-btn" data-action="edit-loot" data-id="${id}" title="Bearbeiten">✏️</button>
                    <button class="loot-detail-btn danger" data-action="delete-loot" data-id="${id}" title="Löschen">🗑️</button>
                </div>
            </div>

            ${
                (item.tags || []).length > 0
                    ? `
                <div class="loot-tags-section">
                    <div class="loot-tags">
                        ${(item.tags || []).map(t => `<span class="loot-tag">${LOOT_TAG_LABELS[t] || t}</span>`).join('')}
                    </div>
                </div>
            `
                    : ''
            }

            <div class="loot-section">
                <div class="loot-stats">
                    <div class="loot-stat">
                        <div class="loot-stat-label">Menge</div>
                        <div class="loot-stat-value">${item.quantity}</div>
                    </div>
                    <div class="loot-stat">
                        <div class="loot-stat-label">Wert</div>
                        <div class="loot-stat-value" style="color: var(--gold);">${totalValue.toFixed(0)} GM</div>
                    </div>
                    <div class="loot-stat">
                        <div class="loot-stat-label">Gewicht</div>
                        <div class="loot-stat-value">${item.weight ? item.weight + ' kg' : '—'}</div>
                    </div>
                </div>
            </div>

            ${
                item.origin
                    ? `
                <div class="loot-section">
                    <div class="loot-section-title">Herkunft</div>
                    <div>${ORIGIN_LABELS[item.origin] || item.origin}</div>
                </div>
            `
                    : ''
            }

            ${
                item.special
                    ? `
                <div class="loot-section">
                    <div class="loot-section-title">Besonderheit</div>
                    <div>${esc(item.special)}</div>
                </div>
            `
                    : ''
            }

            ${
                item.property
                    ? `
                <div class="loot-section">
                    <div class="loot-section-title">Eigenschaft</div>
                    <div>${esc(item.property)}</div>
                </div>
            `
                    : ''
            }

            ${
                item.description
                    ? `
                <div class="loot-section">
                    <div class="loot-section-title">Beschreibung</div>
                    <div class="loot-desc">${sanitizeHTML(item.description)}</div>
                </div>
            `
                    : ''
            }
        </div>
    `;
}
function clearLootDetail() {
    const panel = $('loot-detail-panel');
    if (panel) {
        panel.innerHTML = `
            <div class="loot-detail-empty">
                <div class="loot-detail-empty-icon">📦</div>
                <div class="loot-detail-empty-text">Wähle ein Item aus der Liste</div>
            </div>
        `;
    }
}
function setLootFilter(f) {
    currentLootFilter = f;
    renderLootList();
}
function showLootModal(id = null) {
    window.clearLootForm();
    const modal = $('loot-modal');
    const title = modal?.querySelector('.modal-title');
    if (id) {
        const item = EntityLookup.lootItem(id);
        if (!item) return;
        if (title) title.textContent = 'Item bearbeiten';
        const editIdInput = $('edit-loot-id');
        if (editIdInput) editIdInput.value = String(id);
        const nameInput = $('loot-name');
        const catInput = $('loot-cat');
        const rarityInput = $('loot-rarity');
        const qtyInput = $('loot-qty');
        const wtInput = $('loot-wt');
        const valInput = $('loot-val');
        const descDiv = $('loot-desc');
        if (nameInput) nameInput.value = item.name || '';
        if (catInput) catInput.value = item.category || 'misc';
        if (rarityInput) rarityInput.value = item.rarity || 'normal';
        if (qtyInput) qtyInput.value = String(item.quantity || 1);
        if (wtInput) wtInput.value = String(item.weight || '');
        if (valInput) valInput.value = String(item.value || '');
        if (descDiv) descDiv.innerHTML = sanitizeHTML(item.description || '');
        const originInput = $('loot-origin');
        const specialInput = $('loot-special');
        const propertyInput = $('loot-property');
        if (originInput) originInput.value = item.origin || '';
        if (specialInput) specialInput.value = item.special || '';
        if (propertyInput) propertyInput.value = item.property || '';
        // Tags laden
        document.querySelectorAll('#loot-tag-grid .loot-tag-chip input').forEach(cb => {
            cb.checked = (item.tags || []).includes(cb.value);
        });
        window.updateLootSelectedTags();
        const saveBtn = $('loot-save-btn');
        if (saveBtn) saveBtn.textContent = '💾 Speichern';
    } else {
        if (title) title.textContent = 'Item hinzufügen';
        const saveBtn = $('loot-save-btn');
        if (saveBtn) saveBtn.textContent = '+ Hinzufügen';
    }
    showModal('loot-modal');
    $('loot-name')?.focus();
}
function saveLoot() {
    const nameInput = $('loot-name');
    const name = nameInput.value.trim();
    if (!name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }
    const editIdInput = $('edit-loot-id');
    const editId = editIdInput.value;
    // Tags aus den Checkboxen sammeln
    const tags = [];
    document.querySelectorAll('#loot-tag-grid .loot-tag-chip input:checked').forEach(cb => {
        tags.push(cb.value);
    });
    const catInput = $('loot-cat');
    const rarityInput = $('loot-rarity');
    const qtyInput = $('loot-qty');
    const wtInput = $('loot-wt');
    const valInput = $('loot-val');
    const descDiv = $('loot-desc');
    const originInput = $('loot-origin');
    const specialInput = $('loot-special');
    const propertyInput = $('loot-property');
    const item = {
        name,
        category: catInput.value,
        rarity: rarityInput.value,
        quantity: parseInt(qtyInput.value) || 1,
        weight: parseFloat(wtInput.value) || 0,
        value: parseFloat(valInput.value) || 0,
        description: sanitizeHTML(descDiv?.innerHTML || ''),
        origin: originInput?.value || '',
        special: specialInput?.value?.trim() || '',
        property: propertyInput?.value?.trim() || '',
        tags: tags,
        attunement: tags.includes('attunement')
    };
    const D = window.D;
    if (editId) {
        // Update existing item
        const idx = D.loot.findIndex(i => i.id === parseInt(editId));
        if (idx > -1) {
            D.loot[idx] = { ...D.loot[idx], ...item };
            showToast('Item aktualisiert');
            // Detail-Panel aktualisieren falls selbes Item
            if (selectedLootId === parseInt(editId)) {
                showLootDetail(parseInt(editId));
            }
        }
    } else {
        // Add new item (or merge with existing)
        const newItem = { ...item, id: nextId('loot') };
        const existing = D.loot.find(
            i =>
                i.name.toLowerCase() === name.toLowerCase() &&
                i.category === newItem.category &&
                i.rarity === newItem.rarity
        );
        if (existing) {
            existing.quantity += newItem.quantity;
            showToast('Menge erhöht');
        } else {
            D.loot.push(newItem);
            showToast('Item hinzugefügt');
            // Neues Item selektieren
            selectedLootId = newItem.id;
        }
    }
    hideModal('loot-modal');
    window.clearLootForm();
    renderLootList();
    if (selectedLootId) showLootDetail(selectedLootId);
    window.save();
}
function editLoot(id) {
    showLootModal(id);
}
function removeLoot(id) {
    if (confirm('Item entfernen?')) {
        window.pushUndo('Beute entfernt');
        const D = window.D;
        D.loot = D.loot.filter(i => i.id !== id);
        // Selektion zurücksetzen falls gelöschtes Item selektiert war
        if (selectedLootId === id) {
            selectedLootId = null;
            clearLootDetail();
        }
        renderLootList();
        window.save();
        showToast('Item entfernt');
    }
}

// ============================================================
// GLOBAL EXPORTS (for backward compatibility)
// ============================================================
window.renderLoot = renderLoot;
window.renderLootList = renderLootList;
window.selectLoot = selectLoot;
window.setLootFilter = setLootFilter;
window.showLootModal = showLootModal;
window.saveLoot = saveLoot;
window.editLoot = editLoot;
window.removeLoot = removeLoot;
