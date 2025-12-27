// ============================================================
// ENCOUNTERS RENDER - Hauptrendering-Funktionen
// ============================================================
// Extrahiert aus features/render-encounters.js

// State für expanded Encounter Cards
let expandedEncounterCards = new Set();

function renderEncounters() {
    const c = $('encounter-list'); if (!c) return;

    // Counter aktualisieren
    updateCounters({ 'encounter-io-count': D.encounters?.length || 0 });

    // Suche
    const search = ($('encounter-search')?.value || '').toLowerCase();
    let encounters = [...(D.encounters || [])];

    if (search) {
        encounters = encounters.filter(e =>
            e.name.toLowerCase().includes(search) ||
            (e.creatureType || '').toLowerCase().includes(search) ||
            (e.race || '').toLowerCase().includes(search)
        );
    }

    if (!encounters.length) {
        c.innerHTML = renderEmptyState({
            icon: '👹',
            titleEmpty: 'Keine Encounter',
            descEmpty: 'Erstelle Monster und Gegner für deine Kämpfe.',
            buttonText: '➕ Encounter erstellen',
            buttonAction: 'toggle-collapse',
            buttonValue: 'enc-form',
            isFiltered: !!search
        });
        return;
    }

    // Container-Klasse je nach View-Mode
    c.className = viewModes.encounters === 'list' ? 'list-view-container' : 'encounter-grid';

    // Render basierend auf View-Mode
    if (viewModes.encounters === 'list') {
        c.innerHTML = encounters.map(e => renderEncounterListItem(e)).join('');
    } else {
        c.innerHTML = encounters.map(e => renderEncounterGridCard(e)).join('');
    }
}

function renderEncounterListItem(e) {
    // Attribute berechnen
    const attrs = ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(a => {
        const val = e[a] || 10;
        const mod = Math.floor((val - 10) / 2);
        const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
        const name = a.toUpperCase().replace('STR', 'STÄ').replace('DEX', 'GES').replace('CON', 'KON').replace('WIS', 'WEI');
        return `<span style="display: inline-block; text-align: center; padding: 4px 8px; background: var(--bg-dark); border-radius: 4px; min-width: 50px;"><span style="color: var(--text-dim); font-size: 0.75em;">${name}</span><br><span style="color: var(--cyan);">${val}</span> <span style="font-size: 0.8em; color: ${mod >= 0 ? 'var(--green)' : 'var(--red)'};">${modStr}</span></span>`;
    }).join('');

    return `
        <div class="list-view-row encounter-row" data-action="toggle-encounter-card" data-id="${e.id}">
            <div class="row-icon"><span class="row-toggle">▶</span></div>
            <div class="row-main">
                <div class="row-title">${esc(e.name)}</div>
                <div class="row-subtitle">${esc(e.creatureType || e.race || 'Unbekannt')}</div>
            </div>
            <div class="row-cr" title="Challenge Rating">CR ${e.cr || '—'}</div>
            <div class="row-stats">
                <span class="stat-ac" title="Rüstungsklasse">🛡️ ${e.ac || '—'}</span>
                <span class="stat-hp" title="Trefferpunkte">❤️ ${e.hp || '—'}</span>
            </div>
            <div class="row-actions" data-stop-propagation="true">
                <button class="btn btn-sm" data-action="load-enc-stop" data-id="${e.id}" title="Zum Kampf">⚔️</button>
                <button class="btn btn-sm" data-action="edit-enc-stop" data-id="${e.id}" title="Bearbeiten">✏️</button>
                <button class="btn btn-sm btn-danger" data-action="delete-enc-stop" data-id="${e.id}" title="Löschen">🗑️</button>
            </div>
            <div class="row-details">
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
                    <span>⚡ <strong>Init:</strong> ${e.init || '—'}</span>
                    <span>🏃 <strong>Speed:</strong> ${esc(e.speed || '—')}</span>
                    <span>👁️ <strong>Wahr:</strong> ${e.perception || '—'}</span>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">${attrs}</div>
                ${e.actions ? `<div style="margin-top: 8px;"><span style="color: var(--red);">⚔️ Aktionen:</span> ${stripHtml(e.actions)}</div>` : ''}
                ${e.traits ? `<div style="margin-top: 4px;"><span style="color: var(--purple);">⚡ Eigenschaften:</span> ${stripHtml(e.traits)}</div>` : ''}
                ${(e.resistances?.length || e.immunities?.length) ? `<div style="margin-top: 4px;">${e.resistances?.length ? `<span style="color: var(--cyan);">🛡️ Res: ${e.resistances.join(', ')}</span>` : ''}${e.immunities?.length ? ` <span style="color: var(--gold);">⭐ Imm: ${e.immunities.join(', ')}</span>` : ''}</div>` : ''}
            </div>
        </div>
    `;
}

function renderEncounterGridCard(e) {
    const isExpanded = expandedEncounterCards.has(e.id);
    const attrs = ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(a => {
        const val = e[a] || 10;
        const mod = Math.floor((val - 10) / 2);
        const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
        return { name: a.toUpperCase().replace('STR', 'STÄ').replace('DEX', 'GES').replace('CON', 'KON').replace('WIS', 'WEI'), val, mod: modStr };
    });
    const languages = Array.isArray(e.languages) ? e.languages.join(', ') : (e.languages || '—');

    return `<div class="encounter-card ${isExpanded ? 'expanded' : ''}" data-enc-id="${e.id}">
        <div class="encounter-header" data-action="toggle-encounter-card" data-id="${e.id}">
            <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                <div style="flex: 1;">
                    <div class="encounter-name">${esc(e.name)}</div>
                    <div class="encounter-race">${esc(e.creatureType || e.race || '')}${e.cr ? ` • CR ${e.cr}` : ''}</div>
                </div>
                <div class="encounter-compact-stats">
                    <span title="RK">🛡️${e.ac || '—'}</span>
                    <span title="HP">❤️${e.hp || '—'}</span>
                    <span title="Initiative">⚡${e.init || '—'}</span>
                </div>
            </div>
            <span class="encounter-toggle">▶</span>
        </div>
        <div class="encounter-content">
            <div class="encounter-stats">
                <div class="encounter-stat"><div class="encounter-stat-label">RK</div><div class="encounter-stat-value">${e.ac || '—'}</div></div>
                <div class="encounter-stat"><div class="encounter-stat-label">HP</div><div class="encounter-stat-value">${e.hp || '—'}</div></div>
                <div class="encounter-stat"><div class="encounter-stat-label">Init</div><div class="encounter-stat-value">${e.init || '—'}</div></div>
                <div class="encounter-stat"><div class="encounter-stat-label">Speed</div><div class="encounter-stat-value">${esc(e.speed || '—')}</div></div>
                <div class="encounter-stat"><div class="encounter-stat-label">Wahr.</div><div class="encounter-stat-value">${e.perception || '—'}</div></div>
            </div>
            <div style="font-size:0.75em; color:var(--text-dim); margin: 6px 0;">🗣️ ${esc(languages)}</div>
            <div class="encounter-abilities">${attrs.map(a => `<div class="ability-box"><div class="ability-name">${a.name}</div><div class="ability-value">${a.val}</div><div class="ability-mod">${a.mod}</div></div>`).join('')}</div>
            ${e.savingThrows && Object.keys(e.savingThrows).length > 0 ? `<div style="font-size:0.75em; margin-top:6px; color:var(--green);">🛡️ <span style="color:var(--text-dim);">Rettungswürfe:</span> ${Object.keys(e.savingThrows).filter(k => e.savingThrows[k]).map(attr => {
                const val = e[attr] || 10;
                const mod = Math.floor((val - 10) / 2);
                const profBonus = Math.max(2, Math.floor((parseInt(e.cr) || 0) / 4) + 2);
                const total = mod + profBonus;
                const sign = total >= 0 ? '+' : '';
                return `${attr.toUpperCase()} ${sign}${total}`;
            }).join(', ')}</div>` : ''}
            ${(e.resistances?.length || e.immunities?.length || e.conditionImmunities?.length) ? `<div style="font-size:0.75em; margin-top:6px;">
                ${e.resistances?.length ? `<span style="color: var(--cyan);">🛡️ Res: ${e.resistances.join(', ')}</span>` : ''}
                ${e.immunities?.length ? `<span style="color: var(--gold);">${e.resistances?.length ? ' | ' : ''}⭐ Imm: ${e.immunities.join(', ')}</span>` : ''}
                ${e.conditionImmunities?.length ? `<span style="color: var(--purple);">${(e.resistances?.length || e.immunities?.length) ? ' | ' : ''}🚫 Zust: ${e.conditionImmunities.join(', ')}</span>` : ''}
            </div>` : ''}
            ${e.traits ? `<div style="font-size:0.8em; margin-top:6px;"><span style="color:var(--purple);">⚡ Eigenschaften:</span> ${e.traits}</div>` : ''}
            ${e.equipment ? `<div style="font-size:0.8em; margin-top:4px;"><span style="color:var(--text-dim);">🎒 Ausrüstung:</span> ${e.equipment}</div>` : ''}
            ${e.actions ? `<div style="font-size:0.8em; margin-top:4px;"><span style="color:var(--red);">⚔️ Aktionen:</span> ${e.actions}</div>` : ''}
            ${e.skills ? `<div style="font-size:0.8em; margin-top:4px;"><span style="color:var(--cyan);">🎯 Fertigkeiten:</span> ${e.skills}</div>` : ''}
            <div class="btn-group" style="margin-top: 8px;">
                <button class="btn btn-sm" data-action="load-enc-stop" data-id="${e.id}">⚔️ Zum Kampf</button>
                <button class="btn btn-sm" data-action="edit-enc-stop" data-id="${e.id}">✏️</button>
                <button class="btn btn-sm btn-danger" data-action="delete-enc-stop" data-id="${e.id}">🗑️</button>
            </div>
        </div>
    </div>`;
}

function toggleEncounterCard(id) {
    // Bei Listenansicht: Expandiere inline
    if (viewModes.encounters === 'list') {
        const row = document.querySelector(`.list-view-row.encounter-row[data-id="${id}"]`);
        if (row) {
            row.classList.toggle('expanded');
        }
        return;
    }

    // Grid-Ansicht
    if (expandedEncounterCards.has(id)) {
        expandedEncounterCards.delete(id);
    } else {
        expandedEncounterCards.add(id);
    }

    // Direkt das DOM-Element togglen statt komplettes Re-Render
    const card = document.querySelector(`.encounter-card[data-enc-id="${id}"]`);
    if (card) {
        card.classList.toggle('expanded', expandedEncounterCards.has(id));
    }
}
