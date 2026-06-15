// [SECTION:PARTY_RENDER]
// ============================================================
// PARTY RENDER - @character @roster @overview
// ============================================================
/**
 * Renders the party list with characters
 */
function renderParty() {
    const D = window.D;
    const renderConditionsBar = window.renderConditionsBar;
    const CATS = window.CATS;
    const COMBAT_CONSTANTS = window.COMBAT_CONSTANTS;
    const repairCharactersData = window.repairCharactersData;
    const updateDiceCharSelect = window.updateDiceCharSelect;
    const c = $('party-list');
    if (!c) return;
    const roster = $('party-roster');
    // Enable EntityLookup cache for performance during render cycle
    EntityLookup.enableCache();
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
        EntityLookup.clearCache();
        return;
    }
    const searchInput = $('party-search');
    const search = (searchInput?.value || '').toLowerCase();
    const classFilterEl = $('party-class-filter');
    const classFilter = classFilterEl?.value || '';
    // Klassen-Filter-Dropdown befüllen
    const classes = [...new Set(D.characters.map(ch => ch.characterClass).filter(Boolean))].sort();
    populateFilterDropdown(
        'party-class-filter',
        classes.map(cls => ({ id: cls, name: cls })),
        {
            allLabel: '⚔️ Alle Klassen'
        }
    );
    // Counter aktualisieren
    updateCounters({ 'party-io-count': D.characters.length || 0 });
    // Render Roster (always show all characters)
    if (roster) {
        renderPartyRoster(roster, D.characters);
    }
    // Render Party Overview Stats
    renderPartyOverview();
    // Apply filters (single pass)
    const characters = applyFilters(D.characters || [], {
        searchText: search,
        searchFields: ['name', 'playerName', 'characterClass', 'race'],
        filters: {
            characterClass: classFilter
        }
    });
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
        EntityLookup.clearCache();
        return;
    }
    c.innerHTML = characters.map(ch => renderCharacterCard(ch, renderConditionsBar, CATS)).join('');
    // Update dice tab character select
    if (typeof updateDiceCharSelect === 'function') updateDiceCharSelect();
    // Clear EntityLookup cache after render to prevent stale data
    EntityLookup.clearCache();
}
/**
 * Renders the party roster sidebar
 */
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
    container.innerHTML =
        characters
            .map(ch => {
                const hpPct = ch.hpMax > 0 ? (ch.hpCurrent / ch.hpMax) * 100 : 100;
                const hpClass =
                    hpPct <= COMBAT_CONSTANTS.HP_CRITICAL_THRESHOLD
                        ? 'critical'
                        : hpPct <= COMBAT_CONSTANTS.HP_BLOODIED_THRESHOLD
                          ? 'bloodied'
                          : 'healthy';
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
            })
            .join('') +
        `
        <button class="roster-add" data-action="toggle-collapse" data-value="char-form">
            +
            <span>Neu</span>
        </button>
    `;
}
/**
 * Renders a single character card
 */
function renderCharacterCard(ch, renderConditionsBar, CATS) {
    const hpPct = ch.hpMax > 0 ? (ch.hpCurrent / ch.hpMax) * 100 : 100;
    const hpClass = hpPct <= 25 ? 'critical' : hpPct <= 50 ? 'bloodied' : 'healthy';
    const cur = ch.currency || {};
    const coins = [
        cur.pm && `${cur.pm}P`,
        cur.gm && `${cur.gm}G`,
        cur.em && `${cur.em}E`,
        cur.sm && `${cur.sm}S`,
        cur.km && `${cur.km}K`
    ]
        .filter(Boolean)
        .join(' ');
    // Spells & Items
    const spells = (ch.spells || []).map(sid => EntityLookup.spell(sid)).filter(Boolean);
    const itemsRaw = ch.items || [];
    const items = itemsRaw
        .map(item => {
            const itemId = typeof item === 'number' ? item : item.id;
            const qty = typeof item === 'number' ? 1 : item.quantity;
            const lootItem = EntityLookup.lootItem(itemId);
            return lootItem ? { ...lootItem, assignedQty: qty } : null;
        })
        .filter(Boolean);
    // Attributes
    const attrs = ch.attributes || {};
    const hasAttrs = attrs.str || attrs.dex || attrs.con || attrs.int || attrs.wis || attrs.cha;
    // Spell slots
    const slotPips = renderCompactSpellSlots(ch);
    // Conditions
    const conditionsHtml = renderConditionsBar(ch.conditions, 'characters', ch.id);
    // Class display
    const classDisplay = ch.subclass
        ? `${esc(ch.characterClass || '')} (${esc(ch.subclass)})`
        : esc(ch.characterClass || '');
    return `
        <div class="char-card" id="char-${ch.id}" draggable="true" data-sortable data-id="${ch.id}">
            <!-- Header -->
            <div class="char-card-header" data-action="edit-char" data-id="${ch.id}">
                <div class="char-card-avatar">
                    ${ch.avatar ? `<img src="${esc(ch.avatar)}" alt="">` : '👤'}
                </div>
                <div class="char-card-info">
                    <div class="char-card-name">
                        <button class="char-inspiration-toggle${ch.inspiration ? ' active' : ''}" data-action="toggle-inspiration-stop" data-id="${ch.id}" title="${ch.inspiration ? 'Inspiration entfernen' : 'Inspiration vergeben'}">${ch.inspiration ? '⭐' : '☆'}</button>${esc(ch.name)}
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
                        <span class="char-stat-pill-value">${String(ch.speed || '').split('|')[0] || '—'}</span>
                    </div>
                    <div class="char-stat-pill">
                        <span class="char-stat-pill-label">Wahr</span>
                        <span class="char-stat-pill-value">${ch.passivePerception || '—'}</span>
                    </div>
                </div>

                ${
                    hasAttrs
                        ? `
                    <!-- Attributes -->
                    <div class="char-card-attrs">
                        ${['str', 'dex', 'con', 'int', 'wis', 'cha']
                            .map(attr => {
                                const val = attrs[attr] || 10;
                                const mod = Math.floor((val - 10) / 2);
                                const modStr = mod >= 0 ? '+' + mod : String(mod);
                                return `
                                <div class="char-attr-pill">
                                    <div class="char-attr-pill-name">${attr.toUpperCase()}</div>
                                    <div class="char-attr-pill-val">${val}</div>
                                    <div class="char-attr-pill-mod">${modStr}</div>
                                </div>
                            `;
                            })
                            .join('')}
                    </div>
                `
                        : ''
                }

                ${conditionsHtml}

                ${slotPips}

                ${coins ? `<div class="char-card-currency">💰 ${coins}</div>` : ''}

                ${
                    ch.resistances?.length || ch.immunities?.length
                        ? `
                    <div style="font-size: 0.7em; color: var(--text-dim); margin-bottom: 8px;">
                        ${ch.resistances?.length ? `<span style="color: var(--cyan);">🛡️ ${ch.resistances.join(', ')}</span>` : ''}
                        ${ch.immunities?.length ? `<span style="color: var(--gold);"> ⭐ ${ch.immunities.join(', ')}</span>` : ''}
                    </div>
                `
                        : ''
                }

                ${
                    spells.length
                        ? `
                    <div class="char-card-tags">
                        ${spells
                            .slice(0, 6)
                            .map(
                                s => `
                            <span class="char-tag spell" data-action="navigate-entity-stop" data-type="spells" data-id="${s.id}">✨ ${esc(s.name)}</span>
                        `
                            )
                            .join('')}
                        ${spells.length > 6 ? `<span class="char-tag">+${spells.length - 6}</span>` : ''}
                    </div>
                `
                        : ''
                }

                ${
                    items.length
                        ? `
                    <div class="char-card-tags">
                        ${items
                            .slice(0, 4)
                            .map(
                                i => `
                            <span class="char-tag item" data-action="navigate-entity-stop" data-type="loot" data-id="${i.id}">${CATS[i.category]?.split(' ')[0] || '📦'} ${esc(i.name)}${i.assignedQty > 1 ? ' ×' + i.assignedQty : ''}</span>
                        `
                            )
                            .join('')}
                        ${items.length > 4 ? `<span class="char-tag">+${items.length - 4}</span>` : ''}
                    </div>
                `
                        : ''
                }

                <!-- Actions -->
                <div class="char-card-actions" data-stop-propagation="true">
                    <button class="char-action-btn primary" data-action="show-hp-calculator" data-type="characters" data-id="${ch.id}">❤️ HP</button>
                    <button class="char-action-btn" data-action="show-conditions-modal" data-type="characters" data-id="${ch.id}">⚡</button>
                    <button class="char-action-btn" data-action="show-assign-spells" data-id="${ch.id}">✨</button>
                    <button class="char-action-btn" data-action="show-assign-items" data-id="${ch.id}">📦</button>
                    <button class="char-action-btn" data-action="show-char-details" data-id="${ch.id}" title="Details">🔍</button>
                    <button class="char-action-btn danger" data-action="delete-char" data-id="${ch.id}">🗑️</button>
                </div>
            </div>
        </div>
    `;
}
/**
 * Renders compact spell slot pips
 */
function renderCompactSpellSlots(ch) {
    const slots = ch.spellSlots || {};
    const used = ch.spellSlotsUsed || {};
    // Check if character has any spell slots
    let hasSlots = false;
    for (let i = 0; i <= 9; i++) {
        if (slots[i] > 0) {
            hasSlots = true;
            break;
        }
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
/**
 * Scroll to character in list
 */
function scrollToChar(id) {
    const el = document.getElementById('char-' + id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('expanded');
        setTimeout(() => el.classList.remove('expanded'), 2000);
    }
}
// ============================================================
// PARTY OVERVIEW - Quick Stats Header
// ============================================================
/**
 * Renders party overview stats header
 */
function renderPartyOverview() {
    const D = window.D;
    const container = $('party-overview');
    if (!container) return;
    const chars = D.characters || [];
    if (chars.length === 0) {
        container.classList.remove('show');
        return;
    }
    // Calculate stats
    const passivePerceptions = chars.map(c => c.passivePerception || 10);
    const lowestPerception = Math.min(...passivePerceptions);
    const acValues = chars.map(c => c.armorClass || 10);
    const minAC = Math.min(...acValues);
    const maxAC = Math.max(...acValues);
    const acRange = minAC === maxAC ? `${minAC}` : `${minAC}-${maxAC}`;
    const totalHP = chars.reduce((sum, c) => sum + (c.hpMax || 0), 0);
    const currentHP = chars.reduce((sum, c) => sum + (c.hpCurrent || 0), 0);
    const hpPercent = totalHP > 0 ? Math.round((currentHP / totalHP) * 100) : 100;
    const hpStatus = hpPercent <= 25 ? 'critical' : hpPercent <= 50 ? 'bloodied' : 'healthy';
    // Count conditions
    const totalConditions = chars.reduce((sum, c) => sum + (c.conditions?.length || 0), 0);
    container.innerHTML = `
        <div class="party-stat-card">
            <div class="party-stat-icon">👁️</div>
            <div class="party-stat-value">${lowestPerception}</div>
            <div class="party-stat-label">Niedrigste<br>Passive Wahr.</div>
        </div>
        <div class="party-stat-card">
            <div class="party-stat-icon">🛡️</div>
            <div class="party-stat-value">${acRange}</div>
            <div class="party-stat-label">RK<br>Range</div>
        </div>
        <div class="party-stat-card ${hpStatus}">
            <div class="party-stat-icon">❤️</div>
            <div class="party-stat-value">${hpPercent}%</div>
            <div class="party-stat-label">Party<br>HP Status</div>
            <div class="party-hp-bar">
                <div class="party-hp-fill ${hpStatus}" style="width: ${hpPercent}%"></div>
            </div>
        </div>
        <div class="party-stat-card">
            <div class="party-stat-icon">👥</div>
            <div class="party-stat-value">${chars.length}</div>
            <div class="party-stat-label">Party<br>Größe</div>
        </div>
        ${
            totalConditions > 0
                ? `
        <div class="party-stat-card ${totalConditions > 2 ? 'critical' : ''}">
            <div class="party-stat-icon">⚠️</div>
            <div class="party-stat-value">${totalConditions}</div>
            <div class="party-stat-label">Aktive<br>Conditions</div>
        </div>
        `
                : ''
        }
    `;
    container.classList.add('show');
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.renderParty = renderParty;
window.scrollToChar = scrollToChar;
