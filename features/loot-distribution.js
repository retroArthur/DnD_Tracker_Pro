// [SECTION:LOOT_DISTRIBUTION]
// ============================================================
// LOOT DISTRIBUTION - Fair Party Gold/Item Splitting
// ============================================================
/**
 * Loot Distribution System
 * - Fair gold distribution across party
 * - Item assignment to characters
 * - Party treasure overview
 */
function showLootDistributionModal() {
    const D = window.D;
    const characters = D.characters || [];
    if (!characters.length) {
        showToast('Keine Charaktere in der Party', 'error');
        return;
    }
    // Calculate party gold
    const partyGold = calculatePartyGold();
    const content = `
        <div class="ld-modal-content">
            <div class="ld-modal-header">
                <h3>💰 Beute verteilen</h3>
                <button class="btn btn-sm" onclick="hideModal('loot-dist-modal')">✕</button>
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
        </div>
    `;
    let modal = $('loot-dist-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'loot-dist-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal" style="max-width: 600px;">${content}</div>`;
        modal.onclick = (e) => { if (e.target === modal)
            hideModal('loot-dist-modal'); };
        document.body.appendChild(modal);
    }
    else {
        const modalContent = modal.querySelector('.modal');
        if (modalContent)
            modalContent.innerHTML = content;
    }
    showModal('loot-dist-modal');
}
function calculatePartyGold() {
    const D = window.D;
    // Sum from party chest and undistributed loot
    let total = 0;
    // Party chest gold (if available)
    if (D.partyGold) {
        total += D.partyGold;
    }
    // Gold items in loot
    (D.loot || []).forEach((item) => {
        if (item.category === 'gems' || item.name?.toLowerCase().includes('gold')) {
            total += (item.value || 0) * (item.quantity || 1);
        }
    });
    return Math.floor(total);
}
function renderGoldSplit(amount, characters) {
    if (!characters.length)
        return '';
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
    const amountEl = $('ld-gold-amount');
    const amount = parseInt(amountEl?.value || '0') || 0;
    const includedChars = getIncludedCharacters();
    const splitInfo = $('ld-split-info');
    if (splitInfo) {
        splitInfo.innerHTML = renderGoldSplit(amount, includedChars);
    }
}
function getIncludedCharacters() {
    const included = [];
    document.querySelectorAll('.ld-char-include input:checked').forEach(cb => {
        const element = cb;
        const charId = parseInt(element.dataset.charId || '0');
        const char = EntityLookup.character(charId);
        if (char)
            included.push(char);
    });
    return included;
}
function applyGoldSplit() {
    const D = window.D;
    const renderParty = window.renderParty;
    const amountEl = $('ld-gold-amount');
    const amount = parseInt(amountEl?.value || '0') || 0;
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
    // Remainder to party chest (distributed gold is subtracted, remainder stays)
    D.partyGold = remainder;
    hideModal('loot-dist-modal');
    save();
    renderParty();
    showToast(`💰 ${perChar} GM an ${includedChars.length} Charaktere verteilt`, 'success');
}
function collectAllGold() {
    const D = window.D;
    pushUndo('Gold eingesammelt');
    let total = 0;
    D.characters.forEach((char) => {
        total += char.gold || 0;
        char.gold = 0;
    });
    D.partyGold = (D.partyGold || 0) + total;
    // Update modal
    const amountEl = $('ld-gold-amount');
    if (amountEl)
        amountEl.value = String(D.partyGold);
    updateGoldSplit();
    // Update char list
    const charList = $('ld-char-list');
    if (charList) {
        charList.innerHTML = renderDistributionCharacters(D.characters);
    }
    save();
    showToast(`📥 ${total} GM in Party-Kasse gesammelt`, 'success');
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.showLootDistributionModal = showLootDistributionModal;
window.updateGoldSplit = updateGoldSplit;
window.applyGoldSplit = applyGoldSplit;
window.collectAllGold = collectAllGold;
//# sourceMappingURL=loot-distribution.js.map