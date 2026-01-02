// [SECTION:LOOT_DISTRIBUTION]
// ============================================================
// LOOT DISTRIBUTION - Fair Party Gold/Item Splitting
// ============================================================

/**
 * Loot Distribution System
 * - Gold gleichmäßig auf Party aufteilen
 * - Items an Charaktere zuweisen
 * - Übersicht über Party-Schätze
 */

function showLootDistributionModal() {
    const characters = D.characters || [];

    if (!characters.length) {
        showToast('Keine Charaktere in der Party', 'error');
        return;
    }

    // Berechne Party-Gold
    const partyGold = calculatePartyGold();

    const content = `
        <div class="ld-modal-content">
            <div class="ld-modal-header">
                <h3>💰 Beute verteilen</h3>
                <button class="btn btn-sm" onclick="hideModal('loot-dist-modal')">✕</button>
            </div>

            <div class="ld-tabs">
                <button class="ld-tab active" onclick="switchLootTab('gold')">💰 Gold aufteilen</button>
                <button class="ld-tab" onclick="switchLootTab('items')">📦 Items verteilen</button>
            </div>

            <div class="ld-tab-content" id="ld-tab-gold">
                <div class="ld-gold-section">
                    <div class="ld-gold-input">
                        <label>Zu verteilendes Gold:</label>
                        <input type="number" id="ld-gold-amount" value="${partyGold}" min="0" oninput="updateGoldSplit()">
                        <span class="ld-gold-label">GM</span>
                    </div>

                    <div class="ld-split-info" id="ld-split-info">
                        ${renderGoldSplit(partyGold, characters)}
                    </div>

                    <div class="ld-characters" id="ld-char-list">
                        ${renderDistributionCharacters(characters)}
                    </div>

                    <div class="ld-gold-actions">
                        <button class="btn btn-primary" onclick="applyGoldSplit()">💰 Gold verteilen</button>
                        <button class="btn" onclick="collectAllGold()">📥 Alles einsammeln</button>
                    </div>
                </div>
            </div>

            <div class="ld-tab-content hidden" id="ld-tab-items">
                <div class="ld-items-section">
                    ${renderUnassignedItems()}
                </div>
            </div>
        </div>
    `;

    let modal = $('loot-dist-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'loot-dist-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal" style="max-width: 600px;">${content}</div>`;
        modal.onclick = (e) => { if (e.target === modal) hideModal('loot-dist-modal'); };
        document.body.appendChild(modal);
    } else {
        modal.querySelector('.modal').innerHTML = content;
    }

    showModal('loot-dist-modal');
}

function switchLootTab(tab) {
    // Tabs
    document.querySelectorAll('.ld-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.ld-tab[onclick*="${tab}"]`)?.classList.add('active');

    // Content
    document.querySelectorAll('.ld-tab-content').forEach(c => c.classList.add('hidden'));
    $(`ld-tab-${tab}`)?.classList.remove('hidden');
}

function calculatePartyGold() {
    // Summe aus Party-Truhe und unverteiltem Loot
    let total = 0;

    // Party-Truhe Gold (falls vorhanden)
    if (D.partyGold) {
        total += D.partyGold;
    }

    // Gold-Items in Loot
    (D.loot || []).forEach(item => {
        if (item.category === 'gems' || item.name?.toLowerCase().includes('gold')) {
            total += (item.value || 0) * (item.quantity || 1);
        }
    });

    return Math.floor(total);
}

function renderGoldSplit(amount, characters) {
    if (!characters.length) return '';

    const perChar = Math.floor(amount / characters.length);
    const remainder = amount % characters.length;

    return `
        <div class="ld-split-box">
            <div class="ld-split-main">
                <span class="ld-split-amount">${perChar}</span>
                <span class="ld-split-unit">GM pro Person</span>
            </div>
            ${remainder > 0 ? `
                <div class="ld-split-remainder">
                    <span>Rest: ${remainder} GM</span>
                    <span class="ld-split-hint">(geht an Party-Kasse)</span>
                </div>
            ` : ''}
        </div>
    `;
}

function renderDistributionCharacters(characters) {
    return characters.map(char => {
        const currentGold = char.gold || 0;

        return `
            <div class="ld-char-row" data-id="${char.id}">
                <div class="ld-char-info">
                    <span class="ld-char-name">${esc(char.name)}</span>
                    <span class="ld-char-gold">${currentGold} GM</span>
                </div>
                <div class="ld-char-controls">
                    <label class="ld-char-include">
                        <input type="checkbox" checked data-char-id="${char.id}">
                        <span>Einbeziehen</span>
                    </label>
                </div>
            </div>
        `;
    }).join('');
}

function updateGoldSplit() {
    const amount = parseInt($('ld-gold-amount')?.value) || 0;
    const includedChars = getIncludedCharacters();

    const splitInfo = $('ld-split-info');
    if (splitInfo) {
        splitInfo.innerHTML = renderGoldSplit(amount, includedChars);
    }
}

function getIncludedCharacters() {
    const included = [];
    document.querySelectorAll('.ld-char-include input:checked').forEach(cb => {
        const charId = parseInt(cb.dataset.charId);
        const char = EntityLookup.character(charId);
        if (char) included.push(char);
    });
    return included;
}

function applyGoldSplit() {
    const amount = parseInt($('ld-gold-amount')?.value) || 0;
    if (amount <= 0) {
        showToast('Kein Gold zu verteilen', 'warning');
        return;
    }

    const includedChars = getIncludedCharacters();
    if (!includedChars.length) {
        showToast('Keine Charaktere ausgewählt', 'error');
        return;
    }

    pushUndo('Gold verteilt');

    const perChar = Math.floor(amount / includedChars.length);
    const remainder = amount % includedChars.length;

    includedChars.forEach(char => {
        char.gold = (char.gold || 0) + perChar;
    });

    // Rest in Party-Kasse (verteiltes Gold wird abgezogen, Rest bleibt)
    D.partyGold = remainder;

    hideModal('loot-dist-modal');
    save();
    renderParty();
    showToast(`💰 ${perChar} GM an ${includedChars.length} Charaktere verteilt`, 'success');
}

function collectAllGold() {
    pushUndo('Gold eingesammelt');

    let total = 0;

    D.characters.forEach(char => {
        total += char.gold || 0;
        char.gold = 0;
    });

    D.partyGold = (D.partyGold || 0) + total;

    // Update Modal
    $('ld-gold-amount').value = D.partyGold;
    updateGoldSplit();

    // Char-Liste aktualisieren
    const charList = $('ld-char-list');
    if (charList) {
        charList.innerHTML = renderDistributionCharacters(D.characters);
    }

    save();
    showToast(`📥 ${total} GM in Party-Kasse gesammelt`, 'success');
}

function renderUnassignedItems() {
    const items = (D.loot || []).filter(item =>
        !item.assignedTo && item.category !== 'gems'
    );

    if (!items.length) {
        return `
            <div class="ld-items-empty">
                <div class="ld-items-empty-icon">📦</div>
                <div class="ld-items-empty-text">Keine unverteilten Items</div>
            </div>
        `;
    }

    const characters = D.characters || [];

    return `
        <div class="ld-items-list">
            ${items.map(item => `
                <div class="ld-item-row">
                    <div class="ld-item-info">
                        <span class="ld-item-name" style="color: ${RARITY_COLORS[item.rarity] || 'var(--text)'}">
                            ${esc(item.name)}
                        </span>
                        <span class="ld-item-qty">×${item.quantity}</span>
                    </div>
                    <select class="ld-item-assign" onchange="assignItemTo(${item.id}, this.value)">
                        <option value="">Nicht zugewiesen</option>
                        ${characters.map(c => `
                            <option value="${c.id}" ${item.assignedTo === c.id ? 'selected' : ''}>
                                ${esc(c.name)}
                            </option>
                        `).join('')}
                    </select>
                </div>
            `).join('')}
        </div>
    `;
}

function assignItemTo(itemId, charId) {
    const item = EntityLookup.lootItem(itemId);
    if (!item) return;

    item.assignedTo = charId ? parseInt(charId) : null;
    save();

    if (charId) {
        const char = EntityLookup.character(parseInt(charId));
        showToast(`${item.name} → ${char?.name || 'Charakter'}`, 'success');
    }
}

// Party-Inventar-Übersicht
function showPartyInventory() {
    const characters = D.characters || [];

    const content = `
        <div class="ld-modal-content">
            <div class="ld-modal-header">
                <h3>📋 Party-Inventar</h3>
                <button class="btn btn-sm" onclick="hideModal('party-inv-modal')">✕</button>
            </div>

            <div class="ld-party-inv">
                <div class="ld-party-gold">
                    <span class="ld-party-gold-label">💰 Party-Kasse:</span>
                    <span class="ld-party-gold-value">${D.partyGold || 0} GM</span>
                </div>

                <div class="ld-party-chars">
                    ${characters.map(char => {
                        const items = (D.loot || []).filter(i => i.assignedTo === char.id);
                        return `
                            <div class="ld-party-char">
                                <div class="ld-party-char-header">
                                    <span class="ld-party-char-name">${esc(char.name)}</span>
                                    <span class="ld-party-char-gold">${char.gold || 0} GM</span>
                                </div>
                                ${items.length ? `
                                    <div class="ld-party-char-items">
                                        ${items.map(i => `
                                            <span class="ld-party-item" style="color: ${RARITY_COLORS[i.rarity] || 'var(--text)'}">
                                                ${esc(i.name)}${i.quantity > 1 ? ` ×${i.quantity}` : ''}
                                            </span>
                                        `).join('')}
                                    </div>
                                ` : '<div class="ld-party-no-items">Keine Items</div>'}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;

    let modal = $('party-inv-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'party-inv-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal" style="max-width: 500px;">${content}</div>`;
        modal.onclick = (e) => { if (e.target === modal) hideModal('party-inv-modal'); };
        document.body.appendChild(modal);
    } else {
        modal.querySelector('.modal').innerHTML = content;
    }

    showModal('party-inv-modal');
}
