// ============================================================
// LOCATIONS - Render-Funktionen  
// ============================================================
// Extrahiert aus render/main.js

// Globale State-Variable für expanded Locations
let expandedLocations = new Set();

function filterAssignSpells() {
    renderAssignSpellList();
}

function filterAssignItems() {
    renderAssignItemList();
}

function renderFilterList() {
    const c = $('filter-list'); if (!c) return;
    c.innerHTML = D.filters.map(f => `<div class="chip color-${f.color}" style="margin:3px;">${esc(f.name)} <button data-action="delete-filter" data-id="${f.id}" style="background:none;border:none;color:inherit;cursor:pointer;">✕</button></div>`).join('');
}

function addFilter() {
    const name = $('filter-name').value.trim(); if (!name) return;
    D.filters.push({ id: nextId('filters'), name, color: $('filter-color').value });
    $('filter-name').value = '';
    renderFilterList(); renderLocations(); save();
}

function deleteFilter(id) { D.filters = D.filters.filter(f => f.id !== id); renderFilterList(); renderLocations(); save(); }

// ============================================================
// LOCATIONS
// ============================================================

function renderLocations() {
    const c = $('locations-list'); const fb = $('location-filters'); if (!c) return;
    
    // Filter bar
    fb.innerHTML = `<div class="filter-chip ${currentLocFilter === 'all' ? 'active' : ''}" data-action="set-loc-filter" data-value="all">Alle</div>` +
        D.filters.map(f => `<div class="filter-chip color-${f.color} ${currentLocFilter === f.id ? 'active' : ''}" data-action="set-loc-filter" data-id="${f.id}">${esc(f.name)}</div>`).join('');
    
    const search = $('loc-search')?.value.toLowerCase() || '';
    let locs = D.locations;
    
    if (currentLocFilter !== 'all') {
        locs = locs.filter(l => l.filterId === currentLocFilter);
    }
    
    if (search) {
        const npcLocs = new Set(D.npcs.filter(n => n.name.toLowerCase().includes(search)).map(n => n.locationId));
        locs = locs.filter(l => l.name.toLowerCase().includes(search) || npcLocs.has(l.id));
    }
    
    if (!locs.length) { 
        c.innerHTML = renderEmptyState({
            icon: '🏠',
            titleEmpty: 'Keine Orte',
            descEmpty: 'Erstelle Orte für deine Kampagnenwelt.',
            buttonText: '➕ Ort erstellen',
            buttonAction: 'show-modal',
            buttonValue: 'location-modal',
            isFiltered: !!(search || currentLocFilter !== 'all')
        });
        return; 
    }
    
    // Container-Klasse je nach View-Mode
    c.className = viewModes.locations === 'list' ? 'list-view-container' : 'locations-list';
    
    // Listenansicht (kompakt)
    if (viewModes.locations === 'list') {
        c.innerHTML = locs.map(loc => {
            const npcs = D.npcs.filter(n => n.locationId === loc.id);
            const filter = EntityLookup.filter(loc.filterId);
            const descText = loc.description ? stripHtml(loc.description).substring(0, 200) : '';
            
            // NPCs als kompakte Liste
            const npcsPreview = npcs.slice(0, 5).map(n => 
                `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: var(--bg-dark); border-radius: 4px; margin: 2px;">
                    ${n.avatar ? `<img src="${esc(n.avatar)}" style="width: 16px; height: 16px; border-radius: 50%;">` : '🧑'}
                    ${esc(n.name)}
                </span>`
            ).join('');
            
            return `
                <div class="list-view-row location-row" data-action="toggle-location-card" data-id="${loc.id}">
                    <div class="row-icon"><span class="row-toggle">▶</span></div>
                    <div class="row-main">
                        <div class="row-title">${esc(loc.name)}</div>
                        <div class="row-subtitle">${npcs.length ? `${npcs.length} NPC${npcs.length > 1 ? 's' : ''}` : 'Keine NPCs'}</div>
                    </div>
                    ${filter ? `<div class="row-filter" style="background: var(--${filter.color}); color: white;">${esc(filter.name)}</div>` : '<div></div>'}
                    <div class="row-actions" data-stop-propagation="true">
                        <button class="btn btn-sm" data-action="edit-location" data-id="${loc.id}" title="Bearbeiten">✏️</button>
                        <button class="btn btn-sm btn-danger" data-action="delete-location" data-id="${loc.id}" title="Löschen">🗑️</button>
                    </div>
                    <div class="row-details">
                        ${descText ? `<div class="row-details-desc">${esc(descText)}${loc.description && stripHtml(loc.description).length > 200 ? '...' : ''}</div>` : '<div style="color: var(--text-dim);">Keine Beschreibung</div>'}
                        ${npcs.length ? `<div style="margin-top: 8px;"><strong style="color: var(--cyan);">🧑 NPCs:</strong><div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">${npcsPreview}${npcs.length > 5 ? `<span style="color: var(--text-dim); padding: 2px 8px;">+ ${npcs.length - 5} weitere</span>` : ''}</div></div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        return;
    }
    
    // Grid-Ansicht (volle Karten)
    c.innerHTML = locs.map(loc => {
        const npcs = D.npcs.filter(n => n.locationId === loc.id);
        const filter = EntityLookup.filter(loc.filterId);
        const entityLinks = renderEntityLinks(loc.links);
        const entityTags = renderTagsBar(loc.tags);
        const isExpanded = expandedLocations.has(loc.id);
        
        // NPCs als einfache Tags anzeigen
        const npcTags = npcs.length ? `<div class="location-npc-tags">${npcs.map(n => 
            `<span class="npc-tag" data-action="show-npc-popup-stop" data-id="${n.id}" title="${esc(n.role || n.name)}">
                ${n.avatar ? `<img src="${esc(n.avatar)}" class="npc-tag-avatar">` : '🧑'}
                ${esc(n.name)}
            </span>`
        ).join('')}</div>` : '';
        
        return `<div class="location-card ${isExpanded ? 'expanded' : ''}" id="loc-card-${loc.id}" data-loc-id="${loc.id}">
            <div class="location-card-header" data-action="toggle-location-card" data-id="${loc.id}">
                <div style="flex: 1; min-width: 0;">
                    <div class="location-name">
                        <div class="location-name-text">
                            <span style="flex-shrink: 0;">📍</span>
                            <span class="loc-title" title="${esc(loc.name)}">${esc(loc.name)}</span>
                        </div>
                    </div>
                    ${filter ? `<div class="location-filter-badge"><span class="chip color-${filter.color}" style="font-size:9px;">${esc(filter.name)}</span></div>` : ''}
                </div>
                <div class="location-buttons" data-stop-propagation="true">
                    <button class="btn btn-sm" data-action="show-entity-links-modal" data-type="locations" data-id="${loc.id}" title="Verknüpfungen">🔗</button>
                    <button class="btn btn-sm" data-action="show-tags-modal" data-type="locations" data-id="${loc.id}" title="Tags">🏷️</button>
                    <button class="btn btn-sm" data-action="edit-location" data-id="${loc.id}">✏️</button>
                    <button class="btn btn-sm btn-danger" data-action="delete-location" data-id="${loc.id}">🗑️</button>
                </div>
                <span class="location-card-toggle">▶</span>
            </div>
            <div class="location-card-content">
                ${loc.description ? `<div class="location-description">${loc.description}</div>` : '<div style="color:var(--text-dim); font-size:0.85em;">Keine Beschreibung</div>'}
                ${entityTags}
                ${entityLinks}
                ${npcTags}
            </div>
        </div>`;
    }).join('');
}

// Expanded-Status für Ort-Kacheln (Variable bereits oben deklariert)

function toggleLocationCard(id) {
    // Bei Listenansicht: Expandiere inline
    if (viewModes.locations === 'list') {
        const row = document.querySelector(`.list-view-row.location-row[data-id="${id}"]`);
        if (row) {
            row.classList.toggle('expanded');
        }
        return;
    }
    
    // Grid-Ansicht
    if (expandedLocations.has(id)) {
        expandedLocations.delete(id);
    } else {
        expandedLocations.add(id);
    }
    renderLocations();
}

function expandAllLocations() {
    if (viewModes.locations === 'list') {
        // Listenansicht: Direkt DOM manipulieren
        document.querySelectorAll('.list-view-row.location-row').forEach(row => {
            row.classList.add('expanded');
        });
        showToast('Alle Orte ausgeklappt');
    } else {
        // Grid-Ansicht
        (D.locations || []).forEach(l => expandedLocations.add(l.id));
        renderLocations();
    }
}

function collapseAllLocations() {
    if (viewModes.locations === 'list') {
        // Listenansicht: Direkt DOM manipulieren
        document.querySelectorAll('.list-view-row.location-row').forEach(row => {
            row.classList.remove('expanded');
        });
        showToast('Alle Orte eingeklappt');
    } else {
        // Grid-Ansicht
        expandedLocations.clear();
        renderLocations();
    }
}

function setLocFilter(f) { currentLocFilter = f; renderLocations(); }

/**
 * Setzt den View-Mode (grid/list) für einen Bereich
 * @param {string} section - npcs, locations oder encounters
 * @param {string} mode - grid oder list
 */

function toggleLocation(id) {
    // For search navigation: scroll to and highlight the location card
    const loc = EntityLookup.location(id);
    if (!loc) return;
    
    // Reset filter to show all
    currentLocFilter = 'all';
    renderLocations();
    
    // Find the location card by ID and highlight it
    setTimeout(() => {
        const card = $(`loc-card-${id}`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.style.transition = 'box-shadow 0.3s ease';
            card.style.boxShadow = '0 0 20px var(--gold)';
            setTimeout(() => {
                card.style.boxShadow = '';
            }, 2000);
        }
    }, 100);
}

function saveLocation() {
    const id = $('edit-loc-id').value;
    const loc = { 
        name: $('loc-name').value.trim(), 
        description: sanitizeHTML($('loc-desc').innerHTML),
        filterId: parseInt($('loc-filter').value) || null 
    };
    if (!loc.name) { showToast('⚠️ Name erforderlich', 'error'); return; }
    if (id) { const idx = D.locations.findIndex(l => l.id === parseInt(id)); if (idx > -1) D.locations[idx] = { ...D.locations[idx], ...loc }; }
    else { loc.id = nextId('locations'); D.locations.push(loc); }
    hideModal('location-modal'); $('edit-loc-id').value = ''; $('loc-name').value = ''; $('loc-desc').innerHTML = '';
    renderLocations(); save();
}

function editLocation(id) {
    const loc = EntityLookup.location(id); if (!loc) return;
    $('edit-loc-id').value = id; 
    $('loc-name').value = loc.name; 
    $('loc-desc').innerHTML = sanitizeHTML(loc.description) || '';
    populateSelects(); if (loc.filterId) $('loc-filter').value = loc.filterId;
    showModal('location-modal');
}

function deleteLocation(id) { if (confirm('Löschen?')) { D.locations = D.locations.filter(l => l.id !== id); renderLocations(); save(); } }

function addTriggerField() {
    const c = $('npc-triggers-container'); 
    if (c.children.length >= 10) {
        showToast('Maximal 10 Trigger');
        return;
    }
    const div = document.createElement('div'); 
    div.id = `trigger-${triggerCount++}`;
    div.className = 'npc-trigger-field';
    div.style.cssText = 'background: var(--bg-dark); padding: 10px; border-radius: 6px; margin-bottom: 8px; border: 1px solid var(--border);';
    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="color: var(--yellow); font-weight: 600; font-size: 0.85em;">🔔 Trigger</span>
            <button type="button" class="btn btn-sm btn-danger" data-action="remove-field-stop" data-value=".npc-trigger-field">✕</button>
        </div>
        <div class="form-grid" style="margin: 0;">
            <div class="form-group" style="margin: 0;"><label style="font-size: 0.85em;">Bedingung</label><input type="text" class="trigger-cond" placeholder="z.B. Wenn vertraut, Nach Quest X"></div>
            <div class="form-group" style="margin: 0;"><label style="font-size: 0.85em;">Enthüllung</label><input type="text" class="trigger-reveal" placeholder="Was wird enthüllt?"></div>
        </div>`;
    c.appendChild(div);
}

// ============================================================
// NPC LIST VIEW
// ============================================================

