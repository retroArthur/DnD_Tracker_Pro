// ============================================================
// NPC RENDER - Hauptrendering-Funktionen
// ============================================================
// Extrahiert aus features/render-npcs.js

function renderNPCList() {
    const container = $('npc-list');
    if (!container) return;

    // Robuste Daten-Prüfung
    if (!Array.isArray(D.npcs)) {
        container.innerHTML = renderEmptyState({
            icon: '⚠️',
            titleEmpty: 'Daten beschädigt',
            descEmpty: 'D.npcs ist kein Array. Bitte Daten reparieren.',
            buttonText: '🔧 Reparieren',
            buttonAction: 'call',
            buttonValue: 'repairDataArrays'
        });
        return;
    }

    // Populate location filter dropdown
    populateFilterDropdown('npc-list-filter', D.locations || [], { allLabel: 'Alle Orte' });

    const search = ($('npc-search')?.value || '').toLowerCase();
    const locationFilter = $('npc-list-filter')?.value ? parseInt($('npc-list-filter').value) : null;

    let npcs = [...D.npcs];

    // Apply search filter
    if (search) {
        npcs = npcs.filter(n =>
            n.name.toLowerCase().includes(search) ||
            (n.role || '').toLowerCase().includes(search) ||
            (n.description || '').toLowerCase().includes(search) ||
            (n.dialogs || []).some(d => d.text.toLowerCase().includes(search))
        );
    }

    // Apply location filter
    if (locationFilter) {
        npcs = npcs.filter(n => n.locationId === locationFilter);
    }

    // Sort alphabetically
    npcs.sort((a, b) => a.name.localeCompare(b.name));

    if (!npcs.length) {
        container.innerHTML = renderEmptyState({
            icon: '🎭',
            titleEmpty: 'Keine NPCs',
            descEmpty: 'Erstelle Nicht-Spieler-Charaktere für deine Welt.',
            buttonText: '➕ NPC erstellen',
            buttonAction: 'show-modal',
            buttonValue: 'npc-modal',
            isFiltered: !!(search || locationFilter)
        });
        return;
    }

    // Container-Klasse je nach View-Mode
    container.className = viewModes.npcs === 'list' ? 'list-view-container' : 'npc-grid';

    // Render basierend auf View-Mode
    if (viewModes.npcs === 'list') {
        container.innerHTML = npcs.map(n => renderNPCListItem(n)).join('');
    } else {
        container.innerHTML = npcs.map(n => renderNPCGridCard(n)).join('');
    }

    // Update statistics
    updateNPCStats();
}

function renderNPCListItem(n) {
    const locationName = EntityLookup.getName('locations', n.locationId);
    const dialogCount = (n.dialogs || []).length;
    const triggerCount = (n.triggers || []).length;
    const usedDialogs = (n.dialogs || []).filter(d => d.used).length;
    const avatar = n.avatar
        ? `<img src="${esc(n.avatar)}" alt="">`
        : (n.name ? n.name.charAt(0).toUpperCase() : '?');

    const descText = n.description ? stripHtml(n.description) : '';
    const { questTags, relationTags, infoTags } = renderNPCTags(n);
    const allTags = questTags + relationTags + infoTags;
    const entityTags = renderTagsBar(n.tags);
    const entityLinks = renderEntityLinks(n.links);
    const questBacklinks = renderQuestBacklinks(n);
    const dialogsPreview = renderDialogsPreview(n.dialogs);
    const triggersPreview = renderTriggersPreview(n.triggers);

    return `
        <div class="list-view-row npc-row" data-action="toggle-npc-card" data-id="${n.id}">
            <div class="row-avatar">${avatar}</div>
            <div class="row-main">
                <div class="row-title">
                    <span class="row-toggle">▶</span>
                    ${esc(n.name)}
                    ${n.chapter ? `<span class="row-chapter">(${esc(n.chapter)})</span>` : ''}
                </div>
                <div class="row-subtitle">
                    ${n.race ? `<span class="row-race">${esc(n.race)}</span>` : ''}
                    ${n.race && n.role ? ' • ' : ''}
                    ${n.role ? esc(n.role) : ''}
                    ${locationName !== '—' ? `<span class="row-location">📍 ${locationName}</span>` : ''}
                </div>
            </div>
            <div class="row-meta">
                ${dialogCount ? `<span class="meta-badge dialogs" title="${usedDialogs}/${dialogCount} Dialoge verwendet">💬 ${usedDialogs}/${dialogCount}</span>` : ''}
                ${triggerCount ? `<span class="meta-badge triggers" title="Trigger">🔔 ${triggerCount}</span>` : ''}
            </div>
            <div class="row-actions" data-stop-propagation="true">
                <button class="btn btn-sm" data-action="show-avatar-modal" data-type="npcs" data-id="${n.id}" title="Bild">🖼️</button>
                <button class="btn btn-sm" data-action="edit-npc" data-id="${n.id}" title="Bearbeiten">✏️</button>
                <button class="btn btn-sm btn-danger" data-action="delete-npc" data-id="${n.id}" title="Löschen">🗑️</button>
            </div>
            <div class="row-details">
                ${descText ? `<div class="list-detail-section description"><div class="list-detail-text">${descText}</div></div>` : ''}
                ${allTags ? `<div class="list-detail-section tags"><div class="npc-list-tags">${allTags}</div></div>` : ''}
                ${entityTags ? `<div class="list-detail-section entity-tags">${entityTags}</div>` : ''}
                ${entityLinks ? `<div class="list-detail-section entity-links">${entityLinks}</div>` : ''}
                ${questBacklinks}
                ${dialogCount > 0 ? `
                    <div class="list-detail-section dialogs">
                        <div class="list-detail-header">💬 Dialoge (${usedDialogs}/${dialogCount} verwendet)</div>
                        <div class="list-dialogs-container">${dialogsPreview}</div>
                        ${dialogCount > 3 ? `<div class="list-detail-more">+ ${dialogCount - 3} weitere Dialoge...</div>` : ''}
                    </div>
                ` : ''}
                ${triggerCount > 0 ? `
                    <div class="list-detail-section triggers">
                        <div class="list-detail-header">🔔 Trigger (${triggerCount})</div>
                        <div class="list-triggers-container">${triggersPreview}</div>
                        ${triggerCount > 2 ? `<div class="list-detail-more">+ ${triggerCount - 2} weitere Trigger...</div>` : ''}
                    </div>
                ` : ''}
                <div class="list-detail-actions" data-stop-propagation="true">
                    <button class="btn btn-sm" data-action="show-add-dialog-modal-stop" data-id="${n.id}">💬+ Dialog</button>
                    <button class="btn btn-sm" data-action="show-entity-links-modal-stop" data-type="npcs" data-id="${n.id}">🔗 Links</button>
                    <button class="btn btn-sm" data-action="show-tags-modal-stop" data-type="npcs" data-id="${n.id}">🏷️ Tags</button>
                </div>
            </div>
        </div>
    `;
}

function renderNPCGridCard(n) {
    const locationName = EntityLookup.getName('locations', n.locationId);
    const { questTags, relationTags, infoTags } = renderNPCTags(n);
    const allTags = questTags + relationTags + infoTags;
    const entityTags = renderTagsBar(n.tags);
    const entityLinks = renderEntityLinks(n.links);
    const questBacklinks = renderQuestBacklinks(n);
    const triggersHtml = renderTriggersSection(n);
    const dialogsHtml = renderDialogsSection(n);
    const dialogs = n.dialogs || [];
    const triggers = n.triggers || [];

    const avatarHtml = n.avatar ?
        `<img src="${esc(n.avatar)}" alt="${esc(n.name)}">` :
        '👤';

    return `<div class="npc-list-card collapsed" id="npc-card-${n.id}">
        <div class="npc-card-header">
            <span class="npc-card-toggle" data-action="toggle-npc-card" data-id="${n.id}" title="Auf-/Zuklappen">▼</span>
            <div class="npc-card-avatar">${avatarHtml}</div>
            <div class="npc-card-info">
                <div class="npc-list-name">
                    ${esc(n.name)}
                    ${n.chapter ? `<span style="font-size: 0.7em; color: var(--text-dim); font-weight: normal;">(${esc(n.chapter)})</span>` : ''}
                </div>
                ${n.role || n.race ? `<div class="npc-list-role">${n.race ? `<span style="color: var(--purple);">${esc(n.race)}</span>` : ''}${n.role && n.race ? ' • ' : ''}${n.role ? esc(n.role) : ''}</div>` : ''}
                <div class="npc-card-badges">
                    <span class="npc-list-location">📍 ${esc(locationName)}</span>
                    ${dialogs.length > 0 ? `<span style="font-size: 0.75em; color: var(--purple);">💬 ${dialogs.length}</span>` : ''}
                    ${triggers.length > 0 ? `<span style="font-size: 0.75em; color: var(--yellow);">🔔 ${triggers.length}</span>` : ''}
                </div>
            </div>
            <div class="npc-header-actions">
                <button class="btn btn-sm" data-action="show-avatar-modal" data-type="npcs" data-id="${n.id}" title="Bild">🖼️</button>
                <button class="btn btn-sm" data-action="edit-npc" data-id="${n.id}" title="Bearbeiten">✏️</button>
                <button class="btn btn-sm btn-danger" data-action="delete-npc" data-id="${n.id}" title="Löschen">🗑️</button>
            </div>
        </div>
        <div class="npc-card-body">
            ${n.description ? `<div class="npc-list-desc">${sanitizeHTML(n.description)}</div>` : ''}
            ${allTags ? `<div class="npc-list-tags">${allTags}</div>` : ''}
            ${entityTags}
            ${entityLinks}
            ${questBacklinks}
            ${triggersHtml}
            ${dialogsHtml}
        </div>
        <div class="npc-card-footer">
            <button class="btn btn-sm" data-action="show-add-dialog-modal-stop" data-id="${n.id}" title="Dialog hinzufügen">💬+ Dialog</button>
            <button class="btn btn-sm" data-action="show-entity-links-modal-stop" data-type="npcs" data-id="${n.id}" title="Verknüpfungen">🔗</button>
            <button class="btn btn-sm" data-action="show-tags-modal-stop" data-type="npcs" data-id="${n.id}" title="Tags">🏷️</button>
        </div>
    </div>`;
}

// Helper functions
function renderNPCTags(n) {
    const questTags = (n.quests || []).map(q => {
        const quest = (D.quests || []).find(qst => qst.name && qst.name.toLowerCase() === q.toLowerCase());
        if (quest) {
            return `<span class="npc-list-tag quest clickable" data-action="navigate-entity-stop" data-type="quests" data-id="${quest.id}">📜 ${esc(q)}</span>`;
        }
        return `<span class="npc-list-tag quest">📜 ${esc(q)}</span>`;
    }).join('');

    const relationTags = (n.relationships || []).map(r => {
        const npc = (D.npcs || []).find(np => np.name && np.name.toLowerCase() === r.toLowerCase());
        const char = (D.characters || []).find(c => c.name && c.name.toLowerCase() === r.toLowerCase());
        if (npc) {
            return `<span class="npc-list-tag relation clickable" data-action="navigate-entity-stop" data-type="npcs" data-id="${npc.id}">👥 ${esc(r)}</span>`;
        } else if (char) {
            return `<span class="npc-list-tag relation clickable" data-action="navigate-entity-stop" data-type="characters" data-id="${char.id}">👥 ${esc(r)}</span>`;
        }
        return `<span class="npc-list-tag relation">👥 ${esc(r)}</span>`;
    }).join('');

    const infoTags = (n.info || []).map(i => `<span class="npc-list-tag info">ℹ️ ${esc(i)}</span>`).join('');

    return { questTags, relationTags, infoTags };
}

function renderQuestBacklinks(n) {
    const linkedFromQuests = (D.quests || []).filter(q =>
        (q.links || []).some(link => link.type === 'npcs' && link.id === n.id)
    );

    if (linkedFromQuests.length === 0) return '';

    return `
        <div class="list-detail-section">
            <span class="list-detail-label">📜 Quest-Ziel:</span>
            <div class="list-detail-tags">
                ${linkedFromQuests.slice(0, 3).map(q => `
                    <span class="link-chip" style="background: var(--purple);" data-action="navigate-entity-stop" data-type="quests" data-id="${q.id}">📜 ${esc(q.title)}</span>
                `).join('')}
                ${linkedFromQuests.length > 3 ? `<span class="link-chip" style="background: var(--bg-dark);">+${linkedFromQuests.length - 3}</span>` : ''}
            </div>
        </div>
    `;
}

function renderDialogsPreview(dialogs) {
    if (!dialogs || dialogs.length === 0) return '';

    return dialogs.slice(0, 3).map((d, idx) => {
        const dialogText = stripHtml(d.text || '');
        return `<div class="list-dialog-item ${d.used ? 'used' : ''}">
            <span class="list-dialog-marker ${d.used ? 'used' : ''}">${idx + 1}</span>
            <div class="list-dialog-content">
                <span class="list-dialog-title">${esc(d.title || d.situation || 'Dialog ' + (idx + 1))}</span>
                <span class="list-dialog-text">"${dialogText.substring(0, 80)}${dialogText.length > 80 ? '...' : ''}"</span>
            </div>
            <span class="list-dialog-status">${d.used ? '✓' : '○'}</span>
        </div>`;
    }).join('');
}

function renderTriggersPreview(triggers) {
    if (!triggers || triggers.length === 0) return '';

    return triggers.slice(0, 2).map(t => `
        <div class="list-trigger-item ${t.triggered ? 'triggered' : ''}">
            <span class="list-trigger-check">${t.triggered ? '✓' : '○'}</span>
            <span class="list-trigger-condition">${esc(t.condition)}</span>
        </div>
    `).join('');
}

function renderTriggersSection(n) {
    const triggers = n.triggers || [];
    if (triggers.length === 0) return '';

    return `
        <div class="npc-triggers-section">
            <div class="npc-triggers-header" data-action="toggle-npc-section" data-id="${n.id}">
                <span class="npc-section-arrow">▶</span>
                <span>🔔 Trigger (${triggers.length})</span>
            </div>
            <div class="npc-triggers-content collapsed">
                ${triggers.map((t, idx) => `
                    <div class="npc-trigger-item">
                        <div class="npc-trigger-check ${t.triggered ? 'triggered' : ''}"
                             data-action="toggle-npc-trigger-stop" data-id="${n.id}" data-value="${idx}"
                             title="Klicken um Trigger zu aktivieren/deaktivieren">
                            ${t.triggered ? '✓' : ''}
                        </div>
                        <div style="flex: 1;">
                            <div class="npc-trigger-condition">${esc(t.condition)}</div>
                            <div class="npc-trigger-reveal ${t.triggered ? '' : 'hidden'}">${esc(t.reveal)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderDialogsSection(n) {
    const dialogs = n.dialogs || [];
    if (dialogs.length === 0) return '';

    const usedCount = dialogs.filter(d => d.used).length;

    return `
        <div class="npc-dialogs-section">
            <div class="npc-dialogs-header" data-action="toggle-npc-dialogs">
                <span style="display: flex; align-items: center; gap: 8px;">
                    <span>▶</span>
                    <span>💬 Dialoge</span>
                </span>
                <span class="npc-dialogs-count">${usedCount}/${dialogs.length} verwendet</span>
            </div>
            <div class="npc-dialogs-content">
                ${dialogs.map((d, idx) => `
                    <div class="npc-dialog-item">
                        <div class="npc-dialog-header" data-action="toggle-npc-dialog">
                            <div class="npc-dialog-marker ${d.used ? 'used' : ''}">${idx + 1}</div>
                            <div class="npc-dialog-title ${d.used ? 'used' : ''}">${esc(d.title || 'Dialog ' + (idx + 1))}</div>
                            ${d.triggerCondition ? `<span class="npc-dialog-trigger-badge">🔔 ${esc(d.triggerCondition)}</span>` : ''}
                            <span class="npc-dialog-status ${d.used ? 'used' : 'unused'}">${d.used ? '✓ Verwendet' : '○ Offen'}</span>
                            <span class="npc-dialog-expand">▼</span>
                        </div>
                        <div class="npc-dialog-body">
                            <div class="npc-dialog-text">${esc(d.text)}</div>
                            <div class="npc-dialog-actions">
                                <button class="btn btn-sm ${d.used ? '' : 'btn-success'}" data-action="toggle-npc-dialog-stop" data-id="${n.id}" data-value="${idx}">
                                    ${d.used ? '↩️ Zurücksetzen' : '✓ Als verwendet markieren'}
                                </button>
                                <button class="btn btn-sm" data-action="copy-dialog-text-stop" data-id="${n.id}" data-value="${idx}" title="Text kopieren">📋</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function updateNPCStats() {
    const totalDialogs = D.npcs.reduce((sum, n) => sum + (n.dialogs?.length || 0), 0);
    const totalTriggers = D.npcs.reduce((sum, n) => sum + (n.triggers?.length || 0), 0);
    updateCounters({
        'npc-stats-total': D.npcs.length,
        'npc-stats-dialogs': totalDialogs,
        'npc-stats-triggers': totalTriggers
    });
}

// Expand/Collapse functions
function expandAllNPCCards() {
    document.querySelectorAll('.npc-list-card').forEach(card => card.classList.remove('collapsed'));
    document.querySelectorAll('.list-view-row.npc-row').forEach(row => row.classList.add('expanded'));
    showToast('Alle NPCs ausgeklappt');
}

function collapseAllNPCCards() {
    document.querySelectorAll('.npc-list-card').forEach(card => card.classList.add('collapsed'));
    document.querySelectorAll('.list-view-row.npc-row').forEach(row => row.classList.remove('expanded'));
    showToast('Alle NPCs eingeklappt');
}

function expandAllNPCDialogs() {
    document.querySelectorAll('.npc-dialogs-content').forEach(content => {
        content.classList.add('open');
        const header = content.previousElementSibling;
        if (header) {
            const arrow = header.querySelector('span span:first-child');
            if (arrow) arrow.textContent = '▼';
        }
    });
    document.querySelectorAll('.npc-dialog-body').forEach(body => {
        body.classList.add('open');
        const header = body.previousElementSibling;
        if (header) {
            const expand = header.querySelector('.npc-dialog-expand');
            if (expand) expand.classList.add('open');
        }
    });
    showToast('Alle Dialoge geöffnet');
}

function collapseAllNPCDialogs() {
    document.querySelectorAll('.npc-dialogs-content').forEach(content => {
        content.classList.remove('open');
        const header = content.previousElementSibling;
        if (header) {
            const arrow = header.querySelector('span span:first-child');
            if (arrow) arrow.textContent = '▶';
        }
    });
    document.querySelectorAll('.npc-dialog-body').forEach(body => {
        body.classList.remove('open');
        const header = body.previousElementSibling;
        if (header) {
            const expand = header.querySelector('.npc-dialog-expand');
            if (expand) expand.classList.remove('open');
        }
    });
    showToast('Alle Dialoge geschlossen');
}
