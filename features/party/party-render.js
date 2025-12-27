// ============================================================
// PARTY RENDER - Hauptrendering-Funktionen
// ============================================================
// Extrahiert aus features/render-party.js

function renderParty() {
    const c = $('party-list'); if (!c) return;
    const roster = $('party-roster');

    // Robuste Daten-Prüfung
    if (!Array.isArray(D.characters)) {
        c.innerHTML = renderEmptyState({
            icon: '⚠️',
            titleEmpty: 'Daten beschädigt',
            descEmpty: 'D.characters ist kein Array. Bitte Daten reparieren.',
            buttonText: '🔧 Reparieren',
            buttonAction: 'call',
            buttonValue: 'repairCharactersData'
        });
        if (roster) roster.innerHTML = '';
        return;
    }

    const search = ($('party-search')?.value || '').toLowerCase();
    const classFilter = $('party-class-filter')?.value || '';

    // Klassen-Filter-Dropdown befüllen
    const classes = [...new Set(D.characters.map(ch => ch.characterClass).filter(Boolean))].sort();
    populateFilterDropdown('party-class-filter', classes.map(cls => ({ id: cls, name: cls })), {
        allLabel: '⚔️ Alle Klassen'
    });

    // Counter aktualisieren
    updateCounters({ 'party-io-count': D.characters.length || 0 });

    // Render Roster (always show all characters)
    if (roster) {
        renderPartyRoster(roster, D.characters);
    }

    let characters = D.characters;

    // Klassen-Filter anwenden
    if (classFilter) {
        characters = characters.filter(ch => ch.characterClass === classFilter);
    }

    // Suche anwenden
    if (search) {
        characters = characters.filter(ch =>
            (ch.name || '').toLowerCase().includes(search) ||
            (ch.playerName || '').toLowerCase().includes(search) ||
            (ch.characterClass || '').toLowerCase().includes(search) ||
            (ch.race || '').toLowerCase().includes(search)
        );
    }

    if (!characters.length) {
        c.innerHTML = renderEmptyState({
            icon: '👥',
            titleEmpty: 'Noch keine Charaktere',
            descEmpty: 'Füge deinen ersten Spielercharakter hinzu, um die Heldengruppe zu starten.',
            buttonText: '➕ Charakter erstellen',
            buttonAction: 'toggle-collapse',
            buttonValue: 'char-form',
            isFiltered: !!(search || classFilter)
        });
        return;
    }

    c.innerHTML = characters.map(ch => renderCharacterCard(ch)).join('');

    // Update dice tab character select
    if (typeof updateDiceCharSelect === 'function') updateDiceCharSelect();
}

function renderPartyRoster(container, characters) {
    if (!characters.length) {
        container.innerHTML = `
            <button class="roster-add" data-action="toggle-collapse" data-value="char-form">
                +
                <span>Charakter</span>
            </button>
        `;
        return;
    }

    container.innerHTML = characters.map(ch => {
        const hpPct = ch.hpMax > 0 ? (ch.hpCurrent / ch.hpMax) * 100 : 100;
        const hpClass = hpPct <= 25 ? 'critical' : hpPct <= 50 ? 'bloodied' : 'healthy';
        const conditions = ch.conditions?.length || 0;

        return `
            <div class="roster-char ${hpClass}" data-action="scroll-to-char" data-id="${ch.id}">
                ${conditions > 0 ? `<span class="roster-conditions">${conditions}</span>` : ''}
                <div class="roster-avatar">
                    ${ch.avatar ? `<img src="${esc(ch.avatar)}" alt="">` : '👤'}
                </div>
                <div class="roster-name">${esc(ch.name)}</div>
                <div class="roster-class">${esc(ch.characterClass || '—')}</div>
                <div class="roster-hp-bar">
                    <div class="roster-hp-fill ${hpClass}" style="width: ${Math.max(0, Math.min(100, hpPct))}%"></div>
                </div>
            </div>
        `;
    }).join('') + `
        <button class="roster-add" data-action="toggle-collapse" data-value="char-form">
            +
            <span>Neu</span>
        </button>
    `;
}

function renderCharacterCard(ch) {
    const hpPct = ch.hpMax > 0 ? (ch.hpCurrent / ch.hpMax) * 100 : 100;
    const hpClass = hpPct <= 25 ? 'critical' : hpPct <= 50 ? 'bloodied' : 'healthy';
    const cur = ch.currency || {};
    const coins = [cur.pm && `${cur.pm}P`, cur.gm && `${cur.gm}G`, cur.em && `${cur.em}E`, cur.sm && `${cur.sm}S`, cur.km && `${cur.km}K`].filter(Boolean).join(' ');

    // Spells & Items
    const spells = (ch.spells || []).map(sid => EntityLookup.spell(sid)).filter(Boolean);
    const itemsRaw = ch.items || [];
    const items = itemsRaw.map(item => {
        const itemId = typeof item === 'number' ? item : item.id;
        const qty = typeof item === 'number' ? 1 : item.quantity;
        const lootItem = EntityLookup.lootItem(itemId);
        return lootItem ? { ...lootItem, assignedQty: qty } : null;
    }).filter(Boolean);

    // Attributes
    const attrs = ch.attributes || {};
    const hasAttrs = attrs.str || attrs.dex || attrs.con || attrs.int || attrs.wis || attrs.cha;

    // Spell slots
    const slotPips = renderCompactSpellSlots(ch);

    // Conditions
    const conditionsHtml = renderConditionsBar(ch.conditions, 'characters', ch.id);

    // Class display
    const classDisplay = ch.subclass ? `${esc(ch.characterClass || '')} (${esc(ch.subclass)})` : esc(ch.characterClass || '');

    return `
        <div class="char-card" id="char-${ch.id}" draggable="true" data-sortable data-id="${ch.id}">
            <!-- Header -->
            <div class="char-card-header" data-action="show-char-details" data-id="${ch.id}">
                <div class="char-card-avatar">
                    ${ch.avatar ? `<img src="${esc(ch.avatar)}" alt="">` : '👤'}
                </div>
                <div class="char-card-info">
                    <div class="char-card-name">
                        ${ch.inspiration ? '⭐ ' : ''}${esc(ch.name)}
                        <span class="drag-handle" title="Sortieren">⋮⋮</span>
                    </div>
                    <div class="char-card-meta">
                        ${classDisplay} ${ch.level ? 'Lv.' + ch.level : ''} • ${esc(ch.race || '')}
                        ${ch.playerName ? `• 👤 ${esc(ch.playerName)}` : ''}
                    </div>
                </div>
                <div class="char-card-hp" data-action="show-hp-calculator-stop" data-type="characters" data-id="${ch.id}">
                    <div class="char-card-hp-value ${hpClass}">
                        ${ch.hpCurrent || 0}/${ch.hpMax || 0}${ch.tempHp ? `<span style="color:var(--cyan);">+${ch.tempHp}</span>` : ''}
                    </div>
                    <div class="char-card-hp-bar">
                        <div class="char-card-hp-fill ${hpClass}" style="width: ${Math.max(0, Math.min(100, hpPct))}%"></div>
                    </div>
                </div>
            </div>

            <!-- Body -->
            <div class="char-card-body">
                <!-- Combat Stats -->
                <div class="char-card-stats">
                    <div class="char-stat-pill">
                        <span class="char-stat-pill-label">RK</span>
                        <span class="char-stat-pill-value">${ch.armorClass || '—'}</span>
                    </div>
                    <div class="char-stat-pill">
                        <span class="char-stat-pill-label">Init</span>
                        <span class="char-stat-pill-value">${ch.initiative !== undefined ? (ch.initiative >= 0 ? '+' : '') + ch.initiative : '—'}</span>
                    </div>
                    <div class="char-stat-pill">
                        <span class="char-stat-pill-label">Tempo</span>
                        <span class="char-stat-pill-value">${ch.speed?.split('|')[0] || '—'}</span>
                    </div>
                    <div class="char-stat-pill">
                        <span class="char-stat-pill-label">Wahr</span>
                        <span class="char-stat-pill-value">${ch.passivePerception || '—'}</span>
                    </div>
                </div>

                ${hasAttrs ? `
                    <!-- Attributes -->
                    <div class="char-card-attrs">
                        ${['str', 'dex', 'con', 'int', 'wis', 'cha'].map(attr => {
                            const val = attrs[attr] || 10;
                            const mod = Math.floor((val - 10) / 2);
                            const modStr = mod >= 0 ? '+' + mod : mod;
                            return `
                                <div class="char-attr-pill">
                                    <div class="char-attr-pill-name">${attr.toUpperCase()}</div>
                                    <div class="char-attr-pill-val">${val}</div>
                                    <div class="char-attr-pill-mod">${modStr}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}

                ${conditionsHtml}

                ${slotPips}

                ${coins ? `<div class="char-card-currency">💰 ${coins}</div>` : ''}

                ${(ch.resistances?.length || ch.immunities?.length) ? `
                    <div style="font-size: 0.7em; color: var(--text-dim); margin-bottom: 8px;">
                        ${ch.resistances?.length ? `<span style="color: var(--cyan);">🛡️ ${ch.resistances.join(', ')}</span>` : ''}
                        ${ch.immunities?.length ? `<span style="color: var(--gold);"> ⭐ ${ch.immunities.join(', ')}</span>` : ''}
                    </div>
                ` : ''}

                ${spells.length ? `
                    <div class="char-card-tags">
                        ${spells.slice(0, 6).map(s => `
                            <span class="char-tag spell" data-action="navigate-entity-stop" data-type="spells" data-id="${s.id}">✨ ${esc(s.name)}</span>
                        `).join('')}
                        ${spells.length > 6 ? `<span class="char-tag">+${spells.length - 6}</span>` : ''}
                    </div>
                ` : ''}

                ${items.length ? `
                    <div class="char-card-tags">
                        ${items.slice(0, 4).map(i => `
                            <span class="char-tag item" data-action="navigate-entity-stop" data-type="loot" data-id="${i.id}">${CATS[i.category]?.split(' ')[0] || '📦'} ${esc(i.name)}${i.assignedQty > 1 ? ' ×' + i.assignedQty : ''}</span>
                        `).join('')}
                        ${items.length > 4 ? `<span class="char-tag">+${items.length - 4}</span>` : ''}
                    </div>
                ` : ''}

                <!-- Actions -->
                <div class="char-card-actions" data-stop-propagation="true">
                    <button class="char-action-btn primary" data-action="show-hp-calculator" data-type="characters" data-id="${ch.id}">❤️ HP</button>
                    <button class="char-action-btn" data-action="show-conditions-modal" data-type="characters" data-id="${ch.id}">⚡</button>
                    <button class="char-action-btn" data-action="show-assign-spells" data-id="${ch.id}">✨</button>
                    <button class="char-action-btn" data-action="show-assign-items" data-id="${ch.id}">📦</button>
                    <button class="char-action-btn" data-action="edit-char" data-id="${ch.id}">✏️</button>
                    <button class="char-action-btn danger" data-action="delete-char" data-id="${ch.id}">🗑️</button>
                </div>
            </div>
        </div>
    `;
}

function renderCompactSpellSlots(ch) {
    const slots = ch.spellSlots || {};
    const used = ch.spellSlotsUsed || {};

    // Check if character has any spell slots
    let hasSlots = false;
    for (let i = 0; i <= 9; i++) {
        if (slots[i] > 0) { hasSlots = true; break; }
    }
    if (!hasSlots) return '';

    let html = '<div class="char-card-slots">';

    for (let level = 0; level <= 9; level++) {
        const max = slots[level] || 0;
        const usedCount = used[level] || 0;
        const available = max - usedCount;

        if (max > 0) {
            html += `<div class="char-slot-group">
                <span class="char-slot-label">${level === 0 ? '🔮' : level}</span>`;
            for (let i = 0; i < max; i++) {
                const isAvailable = i < available;
                html += `<span class="char-slot-pip ${isAvailable ? 'available' : ''}"
                    data-action="toggle-spell-slot-stop"
                    data-char="${ch.id}"
                    data-level="${level}"
                    data-index="${i}"
                    title="${isAvailable ? 'Verfügbar' : 'Verbraucht'}"></span>`;
            }
            html += '</div>';
        }
    }

    html += '</div>';
    return html;
}

function scrollToChar(id) {
    const el = document.getElementById('char-' + id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('expanded');
        setTimeout(() => el.classList.remove('expanded'), 2000);
    }
}
