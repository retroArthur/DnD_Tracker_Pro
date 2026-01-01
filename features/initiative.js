// [SECTION:INITIATIVE]
// ============================================================
// INITIATIVE - @combat @turn @round @encounter
// ============================================================
function renderInit() {
    const c = $('init-list'); const rn = $('round-num'); if (!c) return;
    const init = D.initiative;
    if (rn) rn.textContent = init.round;

    // Update encounter-round-num as well
    const ern = $('encounter-round-num');
    if (ern) ern.textContent = init.round;

    // Render battlefield conditions banner
    renderBattlefieldBanner();

    if (!init.combatants.length) { c.innerHTML = '<div style="text-align:center; color:var(--text-dim); padding:30px;">Keine Kämpfer</div>'; return; }
    
    c.innerHTML = init.combatants.map((cb, i) => {
        const active = i === init.currentTurn;
        const dead = cb.currentHp <= 0;
        const hpPct = cb.maxHp > 0 ? (cb.currentHp / cb.maxHp) * 100 : 100;
        const hpClass = hpPct <= 25 ? 'critical' : hpPct <= 50 ? 'bloodied' : 'healthy';
        const effects = (cb.effects || []).map(e => `<span class="init-effect color-${e.color}" data-action="remove-effect" data-id="${cb.id}" data-value="${e.id}" title="${esc(e.description || '')}&#10;Klicken zum Entfernen">${esc(e.name)} ${e.permanent ? '<span class="duration">∞</span>' : '<span class="duration">' + e.duration + 'R</span>'}</span>`).join('');
        const rollInfo = cb.lastRoll ? `<span style="font-size: 10px; color: var(--text-dim);" title="Letzter Wurf: ${cb.lastRoll}">(${cb.lastRoll})</span>` : '';
        
        // AC ermitteln aus verknüpfter Entity
        let ac = cb.ac || 10;
        let entityType = null;
        let entityId = null;
        
        if (cb.type === 'player') {
            const char = EntityLookup.findByName('characters', cb.name);
            if (char) {
                ac = char.ac || char.armorClass || 10;
                entityType = 'characters';
                entityId = char.id;
            }
        } else if (cb.type === 'enemy') {
            // Prüfe zuerst Encounters, dann NPCs
            const enc = EntityLookup.findByName('encounters', cb.name);
            if (enc) {
                ac = enc.ac || enc.armorClass || 10;
                entityType = 'encounters';
                entityId = enc.id;
            } else {
                const npc = EntityLookup.findByName('npcs', cb.name);
                if (npc) {
                    ac = npc.ac || 10;
                    entityType = 'npcs';
                    entityId = npc.id;
                }
            }
        } else if (cb.type === 'ally') {
            const npc = EntityLookup.findByName('npcs', cb.name);
            if (npc) {
                ac = npc.ac || 10;
                entityType = 'npcs';
                entityId = npc.id;
            }
        }
        
        // Name klickbar machen wenn Entity gefunden
        const nameClickHandler = entityType && entityId 
            ? `data-action="navigate-entity-stop" data-type="${entityType}" data-id="${entityId}" title="Klicken für Details"` 
            : '';
        
        // Zauberslots für Spieler
        let spellSlotsHtml = '<div class="init-spell-slots-placeholder"></div>';
        if (cb.type === 'player') {
            const char = EntityLookup.findByName('characters', cb.name);
            if (char && char.spellSlots) {
                const slots = [];
                for (let lvl = 1; lvl <= 9; lvl++) {
                    const slot = char.spellSlots[lvl];
                    if (slot && slot.max > 0) {
                        const used = slot.max - (slot.current || 0);
                        slots.push(`<div class="init-slot-level" title="Grad ${lvl}">
                            <span class="init-slot-label">${lvl}</span>
                            <div class="init-slot-boxes">${Array(slot.max).fill(0).map((_, idx) => 
                                `<span class="init-slot-box ${idx < slot.current ? 'available' : ''}" data-action="toggle-init-slot-stop" data-id="${char.id}" data-value="${lvl},${idx}"></span>`
                            ).join('')}</div>
                        </div>`);
                    }
                }
                if (slots.length > 0) {
                    spellSlotsHtml = `<div class="init-spell-slots">${slots.join('')}</div>`;
                }
            }
        }
        
        // Special handling for lair action entry
        if (cb.type === 'lair') {
            return `<div class="init-entry init-row lair ${active ? 'active' : ''}" draggable="true" data-id="${cb.id}">
                <span class="drag-handle" title="Ziehen zum Umsortieren">⠿</span>
                <div class="init-value" title="Initiative 20 (fest)">20</div>
                <div class="init-ac" style="visibility: hidden;">-</div>
                <div class="init-info" style="flex: 1;">
                    <div class="init-name">${esc(cb.name)}</div>
                    <div class="init-type" style="color: var(--red);">Lair Action</div>
                </div>
                <div class="init-right">
                    <span style="color: var(--text-dim); font-size: 0.8rem; margin-right: 8px;">Am Rundenende</span>
                    <button class="btn btn-sm btn-danger" data-action="remove-combatant" data-id="${cb.id}">❌</button>
                </div>
            </div>`;
        }

        // Get type label
        const typeLabels = { enemy: 'Gegner', player: 'Spieler', ally: 'Verbündeter', monster: 'Monster' };
        const typeLabel = typeLabels[cb.type] || cb.type;

        return `<div class="init-entry init-row ${cb.type} ${active ? 'active' : ''} ${dead ? 'dead' : ''}" draggable="true" data-id="${cb.id}">
            <span class="drag-handle" title="Ziehen zum Umsortieren">⠿</span>
            <div class="init-value" data-action="edit-init-value" data-id="${cb.id}" title="Klicken zum Bearbeiten">${cb.initiative} ${rollInfo}</div>
            <div class="init-ac" title="Rüstungsklasse"><span class="init-ac-icon">🛡️</span>${ac}</div>
            <div class="init-info">
                <div class="init-name" ${nameClickHandler}>${esc(cb.name)}</div>
                <div class="init-type">${typeLabel}${cb.cr ? ` • CR ${cb.cr}` : ''}</div>
                ${effects ? `<div class="init-effects">${effects}</div>` : ''}
            </div>
            ${spellSlotsHtml}
            <div class="init-right">
                <div class="init-hp">
                    <span class="init-hp-value ${hpClass}">${cb.currentHp}/${cb.maxHp}${cb.tempHp ? ` <span style="color:var(--cyan);">(+${cb.tempHp})</span>` : ''}</span>
                    <div class="init-hp-btns">
                        <button class="btn btn-sm btn-success" data-action="mod-hp" data-id="${cb.id}" data-value="1">➕</button>
                        <button class="btn btn-sm btn-danger" data-action="mod-hp" data-id="${cb.id}" data-value="-1">➖</button>
                        <button class="btn btn-sm" data-action="show-hp-calculator" data-type="combatant" data-id="${cb.id}" title="HP ändern">➗</button>
                    </div>
                </div>
                <button class="btn btn-sm" data-action="show-add-effect" data-id="${cb.id}">🔮</button>
                <button class="btn btn-sm btn-danger" data-action="remove-combatant" data-id="${cb.id}">❌</button>
            </div>
        </div>`;
    }).join('');
}

function toggleInitSlot(charId, level, index) {
    const char = EntityLookup.character(charId);
    if (!char || !char.spellSlots || !char.spellSlots[level]) return;
    
    const slot = char.spellSlots[level];
    // Toggle: wenn angeklickte Box verfügbar ist, verbrauchen; sonst wiederherstellen
    if (index < slot.current) {
        // Box ist verfügbar -> verbrauchen (current verringern)
        slot.current = index;
    } else {
        // Box ist verbraucht -> wiederherstellen (current erhöhen)
        slot.current = index + 1;
    }
    
    renderInit();
    save();
}

function endCombat() {
    if (!D.initiative.combatants.length) {
        showToast('Kein aktiver Kampf');
        return;
    }
    if (confirm('Kampf beenden und alle Teilnehmer entfernen?')) {
        D.initiative = { combatants: [], currentTurn: 0, round: 1 };
        renderInit();
        save();
        showToast('⏹️ Kampf beendet');
    }
}

function editInitValue(id) {
    const cb = D.initiative.combatants.find(c => c.id === id); if (!cb) return;
    const val = prompt('Initiative-Wert:', cb.initiative);
    if (val !== null && !isNaN(parseInt(val))) { cb.initiative = parseInt(val); renderInit(); save(); }
}

function addCombatant() {
    const name = $('init-name').value.trim(); if (!name) { showToast('⚠️ Name erforderlich', 'error'); return; }
    const initBonus = parseInt($('init-value').value) || 0;
    const ac = parseInt($('init-ac').value) || 10;
    D.initiative.combatants.push({
        id: nextId('combatants'), name, initiative: initBonus, initBonus: initBonus,
        maxHp: parseInt($('init-hp').value) || 1, currentHp: parseInt($('init-hp').value) || 1,
        ac: ac, type: $('init-type').value, effects: []
    });
    $('init-name').value = ''; $('init-value').value = ''; $('init-hp').value = ''; $('init-ac').value = '';
    sortInit();
}

function addPartyToInit() {
    D.characters.forEach(ch => {
        if (D.initiative.combatants.some(c => c.name === ch.name)) return;
        // Calculate initiative bonus from DEX modifier if available
        const initBonus = 0; // Party characters might not have DEX stored separately
        D.initiative.combatants.push({
            id: nextId('combatants'), name: ch.name, initiative: 0, initBonus: initBonus,
            maxHp: ch.hpMax || 10, currentHp: ch.hpCurrent || ch.hpMax || 10, 
            ac: ch.ac || ch.armorClass || 10, type: 'player', effects: []
        });
    });
    showToast('Party zur Initiative hinzugefügt - klicke "🎲 Alle würfeln"');
    renderInit();
    save();
}

function removeCombatant(id) {
    const idx = D.initiative.combatants.findIndex(c => c.id === id);
    if (idx > -1) { D.initiative.combatants.splice(idx, 1); if (D.initiative.currentTurn >= D.initiative.combatants.length) D.initiative.currentTurn = 0; renderInit(); save(); }
}

function modHp(id, amt) { 
    const c = D.initiative.combatants.find(x => x.id === id); 
    if (!c) return;
    
    if (amt < 0) {
        // Schaden: zuerst temp HP abziehen
        let remaining = Math.abs(amt);
        if (c.tempHp > 0) {
            const absorbed = Math.min(c.tempHp, remaining);
            c.tempHp -= absorbed;
            remaining -= absorbed;
        }
        c.currentHp = Math.max(0, c.currentHp - remaining);
    } else {
        // Heilung
        c.currentHp = Math.min(c.maxHp, c.currentHp + amt);
    }
    renderInit(); 
    save(); 
}

// Wrapper-Funktion für EventDelegation: Character HP updaten
function updateCharacterHP(id, amount) {
    const ch = EntityLookup.character(id);
    if (!ch) return;
    
    if (amount < 0) {
        ch.currentHp = Math.max(0, (ch.currentHp || ch.hp) + amount);
    } else {
        ch.currentHp = Math.min(ch.hp, (ch.currentHp || ch.hp) + amount);
    }
    renderParty();
    save();
}

// Wrapper-Funktion für EventDelegation: Initiative Combatant HP updaten
function updateInitiativeCombatantHP(id, amount) {
    modHp(id, amount);
}

function sortInit() { D.initiative.combatants.sort((a, b) => b.initiative - a.initiative); D.initiative.currentTurn = 0; renderInit(); save(); }

function nextTurn() {
    const init = D.initiative; if (!init.combatants.length) return;
    // Decrease effect durations (not for permanent effects)
    const current = init.combatants[init.currentTurn];
    if (current?.effects) current.effects = current.effects.map(e => e.permanent ? e : { ...e, duration: e.duration - 1 }).filter(e => e.permanent || e.duration > 0);
    init.currentTurn++;
    if (init.currentTurn >= init.combatants.length) { init.currentTurn = 0; init.round++; }
    renderInit(); save();
}

function showAddEffect(id) { 
    $('effect-combatant-id').value = id; 
    $('effect-name').value = '';
    $('effect-duration').value = '1';
    $('effect-color').value = 'red';
    renderEffectConditionsGrid();
    showModal('effect-modal'); 
}

function renderEffectConditionsGrid() {
    const container = $('effect-conditions-grid');
    if (!container) return;
    
    const cbId = parseEntityId($('effect-combatant-id').value);
    const cb = D.initiative.combatants.find(c => c.id === cbId);
    const currentEffects = cb?.effects || [];
    
    // CONDITION_COLORS ist in constants.js definiert

    container.innerHTML = Object.entries(CONDITIONS).map(([key, cond]) => {
        const hasEffect = currentEffects.some(e => e.name.toLowerCase() === cond.name.toLowerCase());
        return `<button class="btn ${hasEffect ? 'btn-success' : ''}" data-action="add-effect-from-grid" data-value="${key}" style="justify-content: flex-start; gap: 8px; padding: 8px 10px; font-size: 0.9em;">
            <span>${cond.icon}</span>
            <span style="flex: 1; text-align: left;">${cond.name}</span>
            ${hasEffect ? '✓' : ''}
        </button>`;
    }).join('');
}

function addEffectFromGrid(conditionKey) {
    const cbId = parseEntityId($('effect-combatant-id').value);
    const cb = D.initiative.combatants.find(c => c.id === cbId);
    if (!cb) return;
    if (!cb.effects) cb.effects = [];
    
    const cond = CONDITIONS[conditionKey];
    if (!cond) return;
    
    // CONDITION_COLORS ist in constants.js definiert

    // Toggle: Wenn bereits vorhanden, entfernen
    const existingIdx = cb.effects.findIndex(e => e.name.toLowerCase() === cond.name.toLowerCase());
    if (existingIdx > -1) {
        cb.effects.splice(existingIdx, 1);
    } else {
        cb.effects.push({
            id: Date.now(),
            name: cond.name,
            duration: 999,
            permanent: true,
            color: CONDITION_COLORS[conditionKey] || 'yellow',
            description: cond.desc
        });
    }
    
    renderEffectConditionsGrid();
    renderInit();
    save();
}

function saveCustomEffect() {
    const cbId = parseEntityId($('effect-combatant-id').value);
    const cb = D.initiative.combatants.find(c => c.id === cbId);
    if (!cb) return;
    if (!cb.effects) cb.effects = [];
    
    const name = $('effect-name').value.trim();
    if (!name) {
        showToast('Bitte einen Namen eingeben');
        return;
    }
    
    const color = $('effect-color').value;
    const duration = parseInt($('effect-duration').value) || 0;
    
    cb.effects.push({
        id: Date.now(),
        name,
        duration: duration || 999,
        permanent: duration === 0,
        color,
        description: ''
    });
    
    hideModal('effect-modal');
    renderInit();
    save();
    showToast(`Effekt "${name}" hinzugefügt`);
}

function removeEffect(cbId, effId) {
    const cb = D.initiative.combatants.find(c => c.id === cbId); if (!cb) return;
    cb.effects = (cb.effects || []).filter(e => e.id !== effId);
    renderInit(); save();
}

// ============================================================
// LOOT - Master-Detail Layout
// ============================================================

let selectedLootId = null;

// RARITY_LABELS, RARITY_COLORS, ORIGIN_LABELS, LOOT_TAG_LABELS sind jetzt in constants.js definiert

// Alias für Kompatibilität
function renderLoot() { renderLootList(); }

function renderLootList() {
    const listContainer = $('loot-list');
    const filterContainer = $('loot-filters');
    if (!listContainer) return;

    // Update counter
    updateCounters({ 'loot-io-count': D.loot?.length || 0 });

    // Render filter chips (by category)
    if (filterContainer) {
        filterContainer.innerHTML = `
            <div class="loot-filter-chip ${currentLootFilter === 'all' ? 'active' : ''}" data-action="set-loot-filter" data-value="all">Alle</div>
            ${Object.entries(CATS).map(([k, v]) => `
                <div class="loot-filter-chip ${currentLootFilter === k ? 'active' : ''}"
                     data-action="set-loot-filter" data-value="${k}">
                    ${v}
                </div>
            `).join('')}
        `;
    }

    // Get search and filter
    const search = ($('loot-search')?.value || '').toLowerCase();
    let items = [...(D.loot || [])];

    // Apply category filter
    if (currentLootFilter !== 'all') {
        items = items.filter(i => i.category === currentLootFilter);
    }

    // Apply search
    if (search) {
        items = items.filter(i =>
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
                ${!search && currentLootFilter === 'all' ? `
                    <button class="loot-add-btn" data-action="show-modal" data-value="loot-modal" style="margin-top: 12px;">
                        + Item hinzufügen
                    </button>
                ` : ''}
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
        el.classList.toggle('selected', el.dataset.id == id);
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

            ${(item.tags || []).length > 0 ? `
                <div class="loot-tags-section">
                    <div class="loot-tags">
                        ${(item.tags || []).map(t => `<span class="loot-tag">${LOOT_TAG_LABELS[t] || t}</span>`).join('')}
                    </div>
                </div>
            ` : ''}

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

            ${item.origin ? `
                <div class="loot-section">
                    <div class="loot-section-title">Herkunft</div>
                    <div>${ORIGIN_LABELS[item.origin] || item.origin}</div>
                </div>
            ` : ''}

            ${item.special ? `
                <div class="loot-section">
                    <div class="loot-section-title">Besonderheit</div>
                    <div>${esc(item.special)}</div>
                </div>
            ` : ''}

            ${item.property ? `
                <div class="loot-section">
                    <div class="loot-section-title">Eigenschaft</div>
                    <div>${esc(item.property)}</div>
                </div>
            ` : ''}

            ${item.description ? `
                <div class="loot-section">
                    <div class="loot-section-title">Beschreibung</div>
                    <div class="loot-desc">${sanitizeHTML(item.description)}</div>
                </div>
            ` : ''}
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

function setLootFilter(f) { currentLootFilter = f; renderLootList(); }

function showLootModal(id = null) {
    clearLootForm();
    const modal = $('loot-modal');
    const title = modal.querySelector('.modal-title');

    if (id) {
        const item = EntityLookup.lootItem(id);
        if (!item) return;

        title.textContent = 'Item bearbeiten';
        $('edit-loot-id').value = id;
        $('loot-name').value = item.name || '';
        $('loot-cat').value = item.category || 'misc';
        $('loot-rarity').value = item.rarity || 'normal';
        $('loot-qty').value = item.quantity || 1;
        $('loot-wt').value = item.weight || '';
        $('loot-val').value = item.value || '';
        $('loot-desc').innerHTML = sanitizeHTML(item.description) || '';

        if ($('loot-origin')) $('loot-origin').value = item.origin || '';
        if ($('loot-special')) $('loot-special').value = item.special || '';
        if ($('loot-property')) $('loot-property').value = item.property || '';

        // Tags laden
        document.querySelectorAll('#loot-tag-grid .loot-tag-chip input').forEach(cb => {
            cb.checked = (item.tags || []).includes(cb.value);
        });
        updateLootSelectedTags();

        $('loot-save-btn').textContent = '💾 Speichern';
    } else {
        title.textContent = 'Item hinzufügen';
        $('loot-save-btn').textContent = '+ Hinzufügen';
    }

    showModal('loot-modal');
    $('loot-name').focus();
}

function saveLoot() {
    const name = $('loot-name').value.trim();
    if (!name) { showToast('⚠️ Name erforderlich', 'error'); return; }

    const editId = $('edit-loot-id').value;

    // Tags aus den Checkboxen sammeln
    const tags = [];
    document.querySelectorAll('#loot-tag-grid .loot-tag-chip input:checked').forEach(cb => {
        tags.push(cb.value);
    });

    const item = {
        name,
        category: $('loot-cat').value,
        rarity: $('loot-rarity').value,
        quantity: parseInt($('loot-qty').value) || 1,
        weight: parseFloat($('loot-wt').value) || 0,
        value: parseFloat($('loot-val').value) || 0,
        description: sanitizeHTML($('loot-desc').innerHTML),
        origin: $('loot-origin')?.value || '',
        special: $('loot-special')?.value?.trim() || '',
        property: $('loot-property')?.value?.trim() || '',
        tags: tags,
        attunement: tags.includes('attunement')
    };

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
        item.id = nextId('loot');
        const existing = D.loot.find(i => i.name.toLowerCase() === name.toLowerCase() && i.category === item.category && i.rarity === item.rarity);
        if (existing) {
            existing.quantity += item.quantity;
            showToast('Menge erhöht');
        } else {
            D.loot.push(item);
            showToast('Item hinzugefügt');
            // Neues Item selektieren
            selectedLootId = item.id;
        }
    }

    hideModal('loot-modal');
    clearLootForm();
    renderLootList();
    if (selectedLootId) showLootDetail(selectedLootId);
    save();
}

function editLoot(id) {
    showLootModal(id);
}

function clearLootForm() {
    $('edit-loot-id').value = '';
    $('loot-name').value = ''; 
    $('loot-qty').value = '1'; 
    $('loot-wt').value = ''; 
    $('loot-val').value = ''; 
    $('loot-desc').innerHTML = ''; 
    $('loot-rarity').value = 'normal';
    $('loot-cat').value = 'weapons';
    
    // Neue Felder leeren
    if ($('loot-origin')) $('loot-origin').value = '';
    if ($('loot-special')) $('loot-special').value = '';
    if ($('loot-property')) $('loot-property').value = '';
    
    // Tags leeren
    document.querySelectorAll('#loot-tag-grid .loot-tag-chip input').forEach(cb => {
        cb.checked = false;
    });
    updateLootSelectedTags();
    
    $('loot-save-btn').textContent = '+ Hinzufügen';
    $('loot-name').placeholder = 'Name *';
}

function removeLoot(id) {
    if (confirm('Item entfernen?')) {
        pushUndo('Beute entfernt');
        D.loot = D.loot.filter(i => i.id !== id);
        // Selektion zurücksetzen falls gelöschtes Item selektiert war
        if (selectedLootId === id) {
            selectedLootId = null;
            clearLootDetail();
        }
        renderLootList();
        save();
        showToast('Item entfernt');
    }
}

// Loot Tag-Filter und Selection Funktionen
function initLootTagSystem() {
    // Tag-Filter Buttons
    document.querySelectorAll('.loot-tag-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.tagCategory;
            
            // Active-Klasse umschalten
            document.querySelectorAll('.loot-tag-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Tags filtern
            document.querySelectorAll('.loot-tag-chip').forEach(chip => {
                if (category === 'all') {
                    chip.classList.remove('hidden');
                } else {
                    chip.classList.toggle('hidden', chip.dataset.category !== category);
                }
            });
        });
    });
    
    // Tag-Checkboxen Event-Listener
    document.querySelectorAll('#loot-tag-grid .loot-tag-chip input').forEach(cb => {
        cb.addEventListener('change', updateLootSelectedTags);
    });
}

function updateLootSelectedTags() {
    const container = $('loot-selected-tags');
    if (!container) return;

    // Verwendet LOOT_TAG_LABELS aus constants.js
    const selectedTags = [];
    document.querySelectorAll('#loot-tag-grid .loot-tag-chip input:checked').forEach(cb => {
        selectedTags.push(cb.value);
    });

    if (selectedTags.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = selectedTags.map(tag =>
        `<span class="loot-selected-tag">
            ${LOOT_TAG_LABELS[tag] || tag}
            <span class="remove-tag" data-action="remove-loot-tag" data-value="${tag}">✕</span>
        </span>`
    ).join('');
}

function removeLootTag(tagValue) {
    const checkbox = document.querySelector(`#loot-tag-grid .loot-tag-chip input[value="${tagValue}"]`);
    if (checkbox) {
        checkbox.checked = false;
        updateLootSelectedTags();
    }
}

// ============================================================
// BATTLEFIELD CONDITIONS
// ============================================================

function renderBattlefieldBanner() {
    const banner = $('battlefield-banner');
    if (!banner) return;

    const bf = D.initiative?.battlefield;

    // Hide banner if no battlefield conditions
    if (!bf || (bf.terrain === 'normal' && !bf.hasLair)) {
        banner.style.display = 'none';
        return;
    }

    banner.style.display = 'flex';

    const tags = [];

    // Terrain tag
    if (bf.terrain && bf.terrain !== 'normal') {
        tags.push(`<span class="bf-tag terrain">${bf.terrainIcon} ${bf.terrainLabel} (×${bf.terrainMod})</span>`);
    }

    // Lair tag
    if (bf.hasLair) {
        tags.push(`<span class="bf-tag lair">🏰 Lair Actions</span>`);
    }

    banner.innerHTML = `
        <span class="bf-label">⚔️ Battlefield:</span>
        <div class="bf-conditions">${tags.join('')}</div>
        <span class="bf-xp">${bf.difficulty} • ${bf.finalXP?.toLocaleString() || '?'} XP</span>
        <button class="bf-clear" data-action="clear-battlefield" title="Battlefield zurücksetzen">✕</button>
    `;
}

function clearBattlefield() {
    if (D.initiative) {
        delete D.initiative.battlefield;
        save();
        renderInit();
        showToast('Battlefield-Bedingungen entfernt');
    }
}

// ============================================================