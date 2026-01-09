// [SECTION:PARTY_DETAILS]
// ============================================================
// PARTY DETAILS - @modal @character @stats
// ============================================================
/**
 * Shows character details modal
 */
function showCharacterDetails(id) {
    const CATS = window.CATS;
    const ch = EntityLookup.character(id);
    if (!ch)
        return;
    const cur = ch.currency || {};
    const coins = [
        cur.pm && `${cur.pm}P`,
        cur.gm && `${cur.gm}G`,
        cur.em && `${cur.em}E`,
        cur.sm && `${cur.sm}S`,
        cur.km && `${cur.km}K`
    ].filter(Boolean).join(' ') || '—';
    const spells = (ch.spells || []).map((sid) => EntityLookup.spell(sid)).filter(Boolean);
    // Support both old format (array of IDs) and new format (array of {id, quantity})
    const itemsRaw = ch.items || [];
    const items = itemsRaw.map((item) => {
        const itemId = typeof item === 'number' ? item : item.id;
        const qty = typeof item === 'number' ? 1 : item.quantity;
        const lootItem = EntityLookup.lootItem(itemId);
        return lootItem ? { ...lootItem, assignedQty: qty } : null;
    }).filter(Boolean);
    const languages = Array.isArray(ch.languages)
        ? ch.languages.join(', ')
        : (ch.languages || '—');
    // Attribute mit Modifiern
    const attrs = ch.attributes || {};
    const attrMod = (val) => {
        const m = Math.floor((val - 10) / 2);
        return m >= 0 ? `+${m}` : `${m}`;
    };
    // Saving throw proficiencies
    const saves = ch.saveProficiencies || {};
    const profSaves = ['str', 'dex', 'con', 'int', 'wis', 'cha']
        .filter(s => saves[s])
        .map(s => s.toUpperCase());
    // Class display
    const classDisplay = ch.subclass
        ? `${esc(ch.characterClass || '—')} (${esc(ch.subclass)})`
        : esc(ch.characterClass || '—');
    // HP Prozent für Farbcodierung
    const hpPct = ch.hpMax > 0 ? (ch.hpCurrent / ch.hpMax) * 100 : 100;
    const hpColor = hpPct <= 25 ? 'var(--red)' : hpPct <= 50 ? 'var(--yellow)' : 'var(--green)';
    const content = `
        <div class="char-modal-header">
            <div class="char-modal-avatar">
                ${ch.avatar ? `<img src="${esc(ch.avatar)}" alt="${esc(ch.name)}">` : `<span class="char-modal-avatar-placeholder">${(ch.name || '?')[0].toUpperCase()}</span>`}
            </div>
            <div class="char-modal-title">
                <h2>${ch.inspiration ? '⭐ ' : ''}${esc(ch.name)}</h2>
                <div class="char-modal-subtitle">${classDisplay} • Lv.${ch.level || 1}</div>
                <div class="char-modal-meta">${esc(ch.race || '')} ${ch.background ? '• ' + esc(ch.background) : ''}</div>
            </div>
            <button class="btn btn-sm char-modal-close" data-action="hide-modal" data-value="char-detail-modal">✕</button>
        </div>

        <div class="char-modal-body">
            <!-- Vital Stats Row -->
            <div class="char-vital-row">
                <div class="char-vital-box hp">
                    <div class="char-vital-icon">❤️</div>
                    <div class="char-vital-value" style="color: ${hpColor};">${ch.hpCurrent || 0}/${ch.hpMax || 0}</div>
                    <div class="char-vital-label">HP</div>
                </div>
                <div class="char-vital-box">
                    <div class="char-vital-icon">🛡️</div>
                    <div class="char-vital-value">${ch.armorClass || '—'}</div>
                    <div class="char-vital-label">RK</div>
                </div>
                <div class="char-vital-box">
                    <div class="char-vital-icon">⚡</div>
                    <div class="char-vital-value">${ch.initiative !== undefined ? (ch.initiative >= 0 ? '+' : '') + ch.initiative : '—'}</div>
                    <div class="char-vital-label">Init</div>
                </div>
                <div class="char-vital-box">
                    <div class="char-vital-icon">👟</div>
                    <div class="char-vital-value">${ch.speed || '—'}</div>
                    <div class="char-vital-label">Speed</div>
                </div>
                <div class="char-vital-box">
                    <div class="char-vital-icon">👁️</div>
                    <div class="char-vital-value">${ch.passivePerception || '—'}</div>
                    <div class="char-vital-label">Wahr.</div>
                </div>
            </div>

            <!-- Attribute Grid -->
            <div class="char-attr-grid">
                ${['str', 'dex', 'con', 'int', 'wis', 'cha'].map(attr => `
                    <div class="char-attr-box ${saves[attr] ? 'proficient' : ''}">
                        <div class="char-attr-name">${attr.toUpperCase()}</div>
                        <div class="char-attr-value">${attrs[attr] || 10}</div>
                        <div class="char-attr-mod">${attrMod(attrs[attr] || 10)}</div>
                    </div>
                `).join('')}
            </div>

            <!-- Two Column Info -->
            <div class="char-info-grid">
                <div class="char-info-section">
                    <div class="char-info-row">
                        <span class="char-info-label">👤 Spieler</span>
                        <span class="char-info-value">${esc(ch.playerName || '—')}</span>
                    </div>
                    <div class="char-info-row">
                        <span class="char-info-label">🎯 Übung</span>
                        <span class="char-info-value">+${ch.proficiencyBonus || 2}</span>
                    </div>
                    <div class="char-info-row">
                        <span class="char-info-label">🎲 Trefferwürfel</span>
                        <span class="char-info-value">${esc(ch.hitDice || '—')}</span>
                    </div>
                    ${profSaves.length ? `<div class="char-info-row">
                        <span class="char-info-label">🛡️ Save-Prof.</span>
                        <span class="char-info-value">${profSaves.join(', ')}</span>
                    </div>` : ''}
                </div>
                <div class="char-info-section">
                    <div class="char-info-row">
                        <span class="char-info-label">💰 Münzen</span>
                        <span class="char-info-value gold">${coins}</span>
                    </div>
                    <div class="char-info-row">
                        <span class="char-info-label">🗣️ Sprachen</span>
                        <span class="char-info-value wrap">${esc(languages)}</span>
                    </div>
                    ${(ch.resistances?.length) ? `<div class="char-info-row">
                        <span class="char-info-label">🛡️ Resist.</span>
                        <span class="char-info-value wrap">${ch.resistances.join(', ')}</span>
                    </div>` : ''}
                    ${(ch.immunities?.length) ? `<div class="char-info-row">
                        <span class="char-info-label">⭐ Immun.</span>
                        <span class="char-info-value wrap">${ch.immunities.join(', ')}</span>
                    </div>` : ''}
                </div>
            </div>

            <!-- Spells & Items -->
            <div class="char-inventory-row">
                <div class="char-inventory-box">
                    <div class="char-inventory-header" data-action="toggle-parent-expanded">
                        <span>✨ Zauber (${spells.length})</span>
                        <span class="char-expand-icon">▼</span>
                    </div>
                    <div class="char-inventory-content">
                        ${spells.length ? spells.map((s) => `<span class="char-tag spell clickable" data-action="navigate-entity-stop" data-type="spells" data-id="${s.id}" title="Klicken für Details">${esc(s.name)}</span>`).join('') : '<span class="char-empty">Keine Zauber</span>'}
                    </div>
                </div>
                <div class="char-inventory-box">
                    <div class="char-inventory-header" data-action="toggle-parent-expanded">
                        <span>📦 Items (${items.length})</span>
                        <span class="char-expand-icon">▼</span>
                    </div>
                    <div class="char-inventory-content">
                        ${items.length ? items.map((i) => `<span class="char-tag item clickable" data-action="navigate-entity-stop" data-type="loot" data-id="${i.id}" title="Klicken für Details">${CATS[i.category]?.split(' ')[0] || '📦'} ${esc(i.name)}${i.assignedQty > 1 ? ` ×${i.assignedQty}` : ''}</span>`).join('') : '<span class="char-empty">Keine Items</span>'}
                    </div>
                </div>
            </div>

            ${ch.notes ? `
            <div class="char-notes-section">
                <div class="char-notes-label">📝 Notizen</div>
                <div class="char-notes-content">${sanitizeHTML(ch.notes)}</div>
            </div>` : ''}
        </div>

        <div class="char-modal-actions">
            <button class="btn" data-action="edit-char-from-modal" data-id="${ch.id}">✏️ Bearbeiten</button>
            <button class="btn" data-action="show-assign-spells-from-modal" data-id="${ch.id}">✨ Zauber</button>
            <button class="btn" data-action="show-assign-items-from-modal" data-id="${ch.id}">📦 Items</button>
        </div>
    `;
    const contentEl = $('char-detail-content');
    if (contentEl) {
        contentEl.innerHTML = content;
    }
    showModal('char-detail-modal');
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.showCharacterDetails = showCharacterDetails;
//# sourceMappingURL=party-details.js.map