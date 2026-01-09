// [SECTION:QUESTS_RENDER]
// ============================================================
// QUESTS RENDER - @filter @cards @status
// ============================================================
function renderQuests() {
    const D = window.D;
    const renderEmptyState = window.renderEmptyState;
    const renderDashboard = window.renderDashboard;
    const c = $('quests-list');
    if (!c)
        return;
    const activeOnlyEl = $('quest-filter-active');
    const activeOnly = activeOnlyEl?.checked || false;
    const searchEl = $('quest-search');
    const search = (searchEl?.value || '').toLowerCase();
    let quests = D.quests;
    if (activeOnly)
        quests = quests.filter((q) => !q.completed);
    if (search)
        quests = quests.filter((q) => q.title.toLowerCase().includes(search) ||
            (q.giverName || '').toLowerCase().includes(search) ||
            (q.locationName || '').toLowerCase().includes(search) ||
            (q.description || '').toLowerCase().includes(search));
    if (!quests.length) {
        c.innerHTML = renderEmptyState({
            icon: '📜',
            titleEmpty: 'Keine Quests',
            descEmpty: 'Erstelle Aufträge und Missionen für deine Abenteurer.',
            buttonText: '➕ Quest erstellen',
            buttonAction: 'show-modal',
            buttonValue: 'quest-modal',
            isFiltered: !!(search || activeOnly)
        });
        return;
    }
    c.innerHTML = quests.map((q) => renderQuestItem(q)).join('');
}
function renderQuestItem(q) {
    const renderEntityLinks = window.renderEntityLinks;
    const renderTagsBar = window.renderTagsBar;
    const renderEntityLink = window.renderEntityLink;
    const entityLinks = renderEntityLinks(q.links);
    const entityTags = renderTagsBar(q.tags);
    // Quest giver name (with EntityLookup)
    const giverDisplay = q.giverId
        ? EntityLookup.getName('npcs', q.giverId)
        : (q.giverName || q.giver || '');
    // Location name (with EntityLookup)
    const locationDisplay = q.locationId
        ? EntityLookup.getName('locations', q.locationId)
        : (q.locationName || q.location || '');
    // Target location name (with EntityLookup)
    const targetDisplay = q.targetId
        ? EntityLookup.getName('locations', q.targetId)
        : (q.targetName || q.target || '');
    // Compile reward
    const rewardParts = [];
    if (q.rewardGold > 0)
        rewardParts.push(`${q.rewardGold} GP`);
    if (q.rewardItems?.length)
        rewardParts.push(q.rewardItems.map((i) => i.name).join(', '));
    if (q.rewardOther)
        rewardParts.push(q.rewardOther);
    if (q.reward && !q.rewardGold && !q.rewardItems?.length && !q.rewardOther) {
        rewardParts.push(q.reward); // Legacy field
    }
    const rewardDisplay = rewardParts.join(' + ') || '—';
    // Quest type badge
    const typeClass = q.type === 'plot' ? 'plot-quest' : q.type === 'side' ? 'side-quest' : 'quest';
    const typeLabel = q.type === 'plot' ? 'Plot' : q.type === 'side' ? 'Side' : 'Quest';
    return `<div class="quest-item ${typeClass} ${q.completed ? 'completed' : ''}" id="quest-${q.id}" draggable="true" data-sortable data-id="${q.id}">
        <div class="quest-header" data-action="toggle-quest" data-id="${q.id}">
            <div class="quest-title-row">
                <span class="drag-handle" title="Zum Sortieren ziehen">⋮⋮</span>
                <button class="btn btn-sm" style="padding: 2px 6px; font-size: 12px; ${q.tracked ? 'background: var(--gold); color: var(--bg-dark);' : ''}" data-action="toggle-quest-tracked-stop" data-id="${q.id}" title="${q.tracked ? 'Wird verfolgt' : 'Verfolgen'}">📌</button>
                <span class="quest-title">${esc(q.title)}</span>
                <span class="quest-type-badge ${q.type || 'quest'}">${typeLabel}</span>
                ${giverDisplay ? renderEntityLink('npcs', q.giverId, giverDisplay, { icon: '👤', fallbackColor: 'var(--cyan)' }) : ''}
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
                <span class="chip ${q.completed ? 'color-green' : ''}" data-action="toggle-quest-status-stop" data-id="${q.id}" data-value="completed">${q.completed ? '✓' : '○'} Done</span>
                <span class="chip ${q.rewardReceived ? 'color-green' : ''}" data-action="toggle-quest-status-stop" data-id="${q.id}" data-value="reward">${q.rewardReceived ? '✓' : '○'} Loot</span>
                <span style="color:var(--text-dim);">▼</span>
            </div>
        </div>
        <div class="quest-details">
            <div style="margin-bottom:10px;">${sanitizeHTML(q.description) || ''}</div>
            ${entityTags}
            ${entityLinks}
            <div style="display:flex; flex-wrap:wrap; gap:15px; font-size:0.9em; margin-bottom:10px;">
                <div><span style="color:var(--text-dim);">📍 Ort:</span> ${renderEntityLink('locations', q.locationId, locationDisplay || '—')}</div>
                <div><span style="color:var(--text-dim);">🎯 Ziel:</span> ${renderEntityLink('locations', q.targetId, targetDisplay || '—')}</div>
                <div><span style="color:var(--text-dim);">💰 Belohnung:</span> <span style="color:var(--gold);">${esc(rewardDisplay)}</span></div>
            </div>
            ${q.epilog ? `<div class="quest-epilog"><div style="font-size:0.8em; color:var(--purple); margin-bottom:4px;">Epilog / Nachwirkungen:</div><div style="font-size:0.9em;">${sanitizeHTML(q.epilog)}</div></div>` : ''}
            <div class="btn-group">
                <button class="btn btn-sm" data-action="show-entity-links-modal" data-type="quests" data-id="${q.id}" title="Verknüpfungen">🔗</button>
                <button class="btn btn-sm" data-action="show-tags-modal" data-type="quests" data-id="${q.id}" title="Tags">🏷️</button>
                <button class="btn btn-sm" data-action="edit-quest" data-id="${q.id}">✏️</button>
                <button class="btn btn-sm btn-danger" data-action="delete-quest" data-id="${q.id}">🗑️</button>
            </div>
        </div>
    </div>`;
}
function toggleQuest(id) {
    const element = $(`quest-${id}`);
    element?.classList.toggle('expanded');
}
function toggleQuestTracked(id) {
    const renderDashboard = window.renderDashboard;
    const q = EntityLookup.quest(id);
    if (!q)
        return;
    q.tracked = !q.tracked;
    renderQuests();
    renderDashboard();
    save();
    showToast(q.tracked ? '📌 Quest wird verfolgt' : '📌 Quest nicht mehr verfolgt');
}
function toggleQuestStatus(id, type) {
    const q = EntityLookup.quest(id);
    if (!q)
        return;
    if (type === 'completed') {
        q.completed = !q.completed;
        if (!q.completed)
            q.rewardReceived = false;
    }
    else {
        q.rewardReceived = !q.rewardReceived;
        if (q.rewardReceived)
            q.completed = true;
    }
    renderQuests();
    save();
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.renderQuests = renderQuests;
window.toggleQuest = toggleQuest;
window.toggleQuestTracked = toggleQuestTracked;
window.toggleQuestStatus = toggleQuestStatus;
//# sourceMappingURL=quests-render.js.map