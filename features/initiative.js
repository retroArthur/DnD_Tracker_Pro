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
        
        return `<div class="init-entry init-row ${cb.type} ${active ? 'active' : ''} ${dead ? 'dead' : ''}" draggable="true" data-id="${cb.id}">
            <span class="drag-handle" title="Ziehen zum Umsortieren">⠿</span>
            <div class="init-value" data-action="edit-init-value" data-id="${cb.id}" title="Klicken zum Bearbeiten">${cb.initiative} ${rollInfo}</div>
            <div class="init-ac" title="Rüstungsklasse"><span class="init-ac-icon">🛡️</span>${ac}</div>
            <div class="init-info">
                <div class="init-name" ${nameClickHandler}>${esc(cb.name)}</div>
                <div class="init-type">${cb.type === 'enemy' ? 'Gegner' : cb.type === 'player' ? 'Spieler' : 'Verbündeter'}</div>
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
    
    const cbId = parseInt($('effect-combatant-id').value);
    const cb = D.initiative.combatants.find(c => c.id === cbId);
    const currentEffects = cb?.effects || [];
    
    // Mapping von CONDITIONS zu Farben für Initiative
    const conditionColors = {
        blinded: 'red', charmed: 'purple', deafened: 'yellow', frightened: 'purple',
        grappled: 'purple', incapacitated: 'red', invisible: 'blue', paralyzed: 'red',
        petrified: 'red', poisoned: 'green', prone: 'yellow', restrained: 'red',
        stunned: 'red', unconscious: 'red', exhaustion: 'yellow', concentration: 'blue'
    };
    
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
    const cbId = parseInt($('effect-combatant-id').value);
    const cb = D.initiative.combatants.find(c => c.id === cbId);
    if (!cb) return;
    if (!cb.effects) cb.effects = [];
    
    const cond = CONDITIONS[conditionKey];
    if (!cond) return;
    
    // Mapping von Conditions zu Farben
    const conditionColors = {
        blinded: 'red', charmed: 'purple', deafened: 'yellow', frightened: 'purple',
        grappled: 'purple', incapacitated: 'red', invisible: 'blue', paralyzed: 'red',
        petrified: 'red', poisoned: 'green', prone: 'yellow', restrained: 'red',
        stunned: 'red', unconscious: 'red', exhaustion: 'yellow', concentration: 'blue'
    };
    
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
            color: conditionColors[conditionKey] || 'yellow',
            description: cond.desc
        });
    }
    
    renderEffectConditionsGrid();
    renderInit();
    save();
}

function saveCustomEffect() {
    const cbId = parseInt($('effect-combatant-id').value);
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
// LOOT
// ============================================================
function renderLoot() {
    const c = $('loot-list'); const catDiv = $('loot-categories'); if (!c) return;
    const search = ($('loot-search')?.value || '').toLowerCase();
    let items = D.loot || [];
    
    // Counter aktualisieren
    updateCounters({ 'loot-io-count': items.length });
    
    catDiv.innerHTML = `<div class="filter-chip ${currentLootFilter === 'all' ? 'active' : ''}" data-action="set-loot-filter" data-value="all">Alle</div>` +
        Object.entries(CATS).map(([k, v]) => `<div class="filter-chip ${currentLootFilter === k ? 'active' : ''}" data-action="set-loot-filter" data-value="${k}">${v}</div>`).join('');
    
    if (currentLootFilter !== 'all') items = items.filter(i => i.category === currentLootFilter);
    
    // Suche anwenden
    if (search) {
        items = items.filter(i => 
            (i.name || '').toLowerCase().includes(search) ||
            (i.description || '').toLowerCase().includes(search) ||
            (i.special || '').toLowerCase().includes(search) ||
            (i.property || '').toLowerCase().includes(search) ||
            (i.tags || []).some(t => t.toLowerCase().includes(search))
        );
    }
    
    if (!items.length) { 
        c.innerHTML = renderEmptyState({
            icon: '📦',
            titleEmpty: 'Truhe ist leer',
            titleFiltered: 'Keine Gegenstände gefunden',
            descEmpty: 'Füge Beute und Ausrüstung hinzu.',
            buttonText: '➕ Gegenstand hinzufügen',
            buttonAction: 'toggle-collapse',
            buttonValue: 'loot-form',
            isFiltered: !!(search || currentLootFilter !== 'all'),
            gridSpan: 'auto'
        });
        return; 
    }
    
    const RARITY_LABELS = { normal: 'Normal', common: 'Gewöhnlich', uncommon: 'Ungewöhnlich', rare: 'Selten', veryrare: 'Sehr selten', legendary: 'Legendär' };
    const ORIGIN_LABELS = { campaign: '📜 Kampagne', quest: '🎯 Quest', summon: '✨ Beschwörung', loot: '💰 Loot', find: '🔍 Fund', purchase: '🛒 Kauf', gift: '🎁 Geschenk', craft: '🔨 Hergestellt' };
    const TAG_LABELS = {
        weapon: '⚔️ Waffe', armor: '🛡️ Rüstung', potion: '🧪 Trank', scroll: '📜 Schriftrolle', ring: '💍 Ring',
        wand: '🪄 Zauberstab', rod: '🏛️ Zepter', staff: '🪵 Stecken', wondrous: '✨ Wundersam', ammunition: '🏹 Munition', focus: '🔮 Fokus',
        light: '🪶 Leicht', heavy: '🏋️ Schwer', finesse: '⚡ Finesse', 'two-handed': '🙌 Zweihändig', versatile: '↔️ Vielseitig',
        reach: '📏 Reichweite', thrown: '🎯 Wurf', loading: '⏳ Laden', silvered: '🥈 Silber', adamantine: '💠 Adamant',
        'light-armor': '👕 Leichte Rüst.', 'medium-armor': '🦺 Mittlere Rüst.', 'heavy-armor': '🛡️ Schwere Rüst.', shield: '🔰 Schild',
        attunement: '🔮 Einstimmung', charges: '⚡ Ladungen', consumable: '💨 Verbrauchsgut', cursed: '💀 Verflucht', sentient: '🧠 Intelligent',
        head: '👑 Kopf', neck: '📿 Hals', back: '🧥 Rücken', body: '👔 Körper', hands: '🧤 Hände', finger: '💍 Finger', waist: '🎗️ Taille', feet: '👢 Füße',
        fire: '🔥 Feuer', cold: '❄️ Kälte', lightning: '⚡ Blitz', acid: '🧪 Säure', poison: '☠️ Gift', necrotic: '💀 Nekrotisch', radiant: '☀️ Strahlend', healing: '💚 Heilung',
        tool: '🔧 Werkzeug', gemstone: '💎 Edelstein', art: '🖼️ Kunstobjekt', container: '📦 Behälter', key: '🗝️ Schlüssel', document: '📄 Dokument'
    };
    const TAG_CATEGORIES = {
        type: ['weapon', 'armor', 'potion', 'scroll', 'ring', 'wand', 'rod', 'staff', 'wondrous', 'ammunition', 'focus'],
        property: ['light', 'heavy', 'finesse', 'two-handed', 'versatile', 'reach', 'thrown', 'loading', 'silvered', 'adamantine'],
        armor: ['light-armor', 'medium-armor', 'heavy-armor', 'shield'],
        magic: ['attunement', 'charges', 'consumable', 'cursed', 'sentient'],
        slot: ['head', 'neck', 'back', 'body', 'hands', 'finger', 'waist', 'feet'],
        damage: ['fire', 'cold', 'lightning', 'acid', 'poison', 'necrotic', 'radiant', 'healing']
    };
    
    c.innerHTML = items.map(i => {
        const catIcon = CATS[i.category]?.split(' ')[0] || '📦';
        const depleted = i.quantity <= 0;
        const rarity = i.rarity || 'normal';
        const rarityLabel = RARITY_LABELS[rarity] || 'Normal';
        const showBadge = rarity !== 'normal';
        const totalValue = (i.value || 0) * Math.max(0, i.quantity);
        const isExpanded = expandedLootItems.has(i.id);
        const hasAttunement = (i.tags || []).includes('attunement') || i.attunement;
        
        // Tags rendern mit Kategorie-Styling
        const tagsHtml = (i.tags || []).length > 0 ? `<div class="loot-item-tags">${
            (i.tags || []).map(t => {
                const category = Object.entries(TAG_CATEGORIES).find(([_, tags]) => tags.includes(t))?.[0] || 'other';
                return `<span class="loot-item-tag ${category}">${TAG_LABELS[t] || t}</span>`;
            }).join('')
        }</div>` : '';
        
        // Details-Bereich mit neuen Feldern
        const detailsHtml = [];
        if (i.origin && ORIGIN_LABELS[i.origin]) {
            detailsHtml.push(`<div class="loot-item-detail"><span class="loot-item-detail-label">Herkunft</span><span class="loot-item-detail-value">${ORIGIN_LABELS[i.origin]}</span></div>`);
        }
        if (i.special) {
            detailsHtml.push(`<div class="loot-item-detail"><span class="loot-item-detail-label">Besonderheit</span><span class="loot-item-detail-value">${esc(i.special)}</span></div>`);
        }
        if (i.property) {
            detailsHtml.push(`<div class="loot-item-detail"><span class="loot-item-detail-label">Eigenschaft</span><span class="loot-item-detail-value">${esc(i.property)}</span></div>`);
        }
        
        return `<div class="loot-item rarity-${rarity} ${depleted ? 'depleted' : ''} ${isExpanded ? 'expanded' : ''}" data-loot-id="${i.id}">
            <div class="loot-item-header" data-action="toggle-loot" data-id="${i.id}">
                <div class="loot-item-icon">${catIcon}</div>
                <div class="loot-item-info">
                    <div class="loot-item-name">${esc(i.name)}${hasAttunement ? '<span class="loot-attunement-badge" title="Einstimmung erforderlich">🔮</span>' : ''}</div>
                    <div class="loot-item-meta-line">
                        <span>×${i.quantity}</span>
                        <span style="color: var(--gold);">${totalValue.toFixed(0)} GM</span>
                        ${showBadge ? `<span class="rarity-badge ${rarity}">${rarityLabel}</span>` : ''}
                    </div>
                </div>
                <span class="loot-item-toggle">▶</span>
            </div>
            <div class="loot-item-content">
                ${detailsHtml.length > 0 ? `<div class="loot-item-detail-row">${detailsHtml.join('')}</div>` : ''}
                ${i.description ? `<div class="loot-item-desc">${i.description}</div>` : ''}
                ${tagsHtml}
                <div class="loot-item-footer">
                    <div class="loot-item-meta">
                        ${i.weight ? `<span>⚖️ ${i.weight} kg</span>` : ''}
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn btn-sm" data-action="edit-loot-stop" data-id="${i.id}" title="Bearbeiten">✏️</button>
                        <button class="btn btn-sm btn-danger" data-action="delete-loot-stop" data-id="${i.id}" title="Löschen">🗑️</button>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

let expandedLootItems = new Set();

function toggleLootItem(id) {
    if (expandedLootItems.has(id)) {
        expandedLootItems.delete(id);
    } else {
        expandedLootItems.add(id);
    }
    
    // Direkt das DOM-Element togglen statt komplettes Re-Render
    const item = document.querySelector(`.loot-item[data-loot-id="${id}"]`);
    if (item) {
        item.classList.toggle('expanded', expandedLootItems.has(id));
    }
}

function expandAllLoot() {
    (D.loot || []).forEach(i => expandedLootItems.add(i.id));
    renderLoot();
}

function collapseAllLoot() {
    expandedLootItems.clear();
    renderLoot();
}

function setLootFilter(f) { currentLootFilter = f; renderLoot(); }

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
        // Neue Felder
        origin: $('loot-origin')?.value || '',
        special: $('loot-special')?.value?.trim() || '',
        property: $('loot-property')?.value?.trim() || '',
        tags: tags,
        // Attunement als Tag behandeln falls vorhanden
        attunement: tags.includes('attunement')
    };
    
    if (editId) {
        // Update existing item
        const idx = D.loot.findIndex(i => i.id === parseInt(editId));
        if (idx > -1) {
            D.loot[idx] = { ...D.loot[idx], ...item };
            showToast('Item aktualisiert');
        }
    } else {
        // Add new item (or merge with existing)
        item.id = nextId('loot');
        const existing = D.loot.find(i => i.name.toLowerCase() === name.toLowerCase() && i.category === item.category && i.rarity === item.rarity);
        if (existing) {
            existing.quantity += item.quantity;
        } else {
            D.loot.push(item);
        }
        showToast('Item hinzugefügt');
    }
    
    clearLootForm();
    // Formular einklappen
    $('loot-form').classList.remove('open');
    $('loot-form-icon').textContent = '▼';
    renderLoot(); 
    save();
}

function editLoot(id) {
    const item = EntityLookup.lootItem(id);
    if (!item) return;
    
    $('edit-loot-id').value = id;
    $('loot-name').value = item.name || '';
    $('loot-cat').value = item.category || 'misc';
    $('loot-rarity').value = item.rarity || 'normal';
    $('loot-qty').value = item.quantity || 1;
    $('loot-wt').value = item.weight || '';
    $('loot-val').value = item.value || '';
    $('loot-desc').innerHTML = sanitizeHTML(item.description) || '';
    
    // Neue Felder laden
    if ($('loot-origin')) $('loot-origin').value = item.origin || '';
    if ($('loot-special')) $('loot-special').value = item.special || '';
    if ($('loot-property')) $('loot-property').value = item.property || '';
    
    // Tags laden
    document.querySelectorAll('#loot-tag-grid .loot-tag-chip input').forEach(cb => {
        cb.checked = (item.tags || []).includes(cb.value);
    });
    updateLootSelectedTags();
    
    $('loot-save-btn').textContent = '✓ Speichern';
    $('loot-name').placeholder = 'Bearbeiten: ' + (item.name || '');
    
    // Formular aufklappen
    $('loot-form').classList.add('open');
    $('loot-form-icon').textContent = '▲';
    
    // Scroll to form & highlight
    $('loot-name').scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('loot-name').focus();
}

function cancelLootEdit() {
    clearLootForm();
    // Formular einklappen
    $('loot-form').classList.remove('open');
    $('loot-form-icon').textContent = '▼';
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

function removeLoot(id) { if (confirm('Entfernen?')) { D.loot = D.loot.filter(i => i.id !== id); renderLoot(); save(); } }

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
    
    const TAG_LABELS = {
        weapon: '⚔️ Waffe', armor: '🛡️ Rüstung', potion: '🧪 Trank', scroll: '📜 Schriftrolle', ring: '💍 Ring',
        wand: '🪄 Zauberstab', rod: '🏛️ Zepter', staff: '🪵 Stecken', wondrous: '✨ Wundersam', ammunition: '🏹 Munition', focus: '🔮 Fokus',
        light: '🪶 Leicht', heavy: '🏋️ Schwer', finesse: '⚡ Finesse', 'two-handed': '🙌 Zweihändig', versatile: '↔️ Vielseitig',
        reach: '📏 Reichweite', thrown: '🎯 Wurf', loading: '⏳ Laden', silvered: '🥈 Silber', adamantine: '💠 Adamant',
        'light-armor': '👕 Leichte Rüst.', 'medium-armor': '🦺 Mittlere Rüst.', 'heavy-armor': '🛡️ Schwere Rüst.', shield: '🔰 Schild',
        attunement: '🔮 Einstimmung', charges: '⚡ Ladungen', consumable: '💨 Verbrauchsgut', cursed: '💀 Verflucht', sentient: '🧠 Intelligent',
        head: '👑 Kopf', neck: '📿 Hals', back: '🧥 Rücken', body: '👔 Körper', hands: '🧤 Hände', finger: '💍 Finger', waist: '🎗️ Taille', feet: '👢 Füße',
        fire: '🔥 Feuer', cold: '❄️ Kälte', lightning: '⚡ Blitz', acid: '🧪 Säure', poison: '☠️ Gift', necrotic: '💀 Nekrotisch', radiant: '☀️ Strahlend', healing: '💚 Heilung',
        tool: '🔧 Werkzeug', gemstone: '💎 Edelstein', art: '🖼️ Kunstobjekt', container: '📦 Behälter', key: '🗝️ Schlüssel', document: '📄 Dokument'
    };
    
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
            ${TAG_LABELS[tag] || tag}
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