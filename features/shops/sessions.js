// [SECTION:SESSIONS]
// Extrahiert aus shops.js
// Session Notes mit Nummern, Tags, Zusammenfassungen und Story-Arcs

// SESSIONS STATE
// ============================================================
let currentSessionTags = [];
let activeTagFilters = [];

// STORY ARCS
// ============================================================
function getStoryArcs() {
    if (!D.storyArcs) D.storyArcs = [];
    return D.storyArcs;
}

function renderStoryArcSelects() {
    const arcs = getStoryArcs();
    const options = '<option value="">— Kein Arc —</option>' + 
        arcs.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('');
    
    const sessionArc = $('session-arc');
    const filterArc = $('filter-session-arc');
    
    if (sessionArc) sessionArc.innerHTML = options;
    if (filterArc) filterArc.innerHTML = '<option value="">Alle</option>' + 
        arcs.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('');
}

function manageStoryArcs() {
    renderStoryArcList();
    showModal('story-arc-modal');
}

function renderStoryArcList() {
    const container = $('story-arc-list');
    if (!container) return;
    
    const arcs = getStoryArcs();
    if (arcs.length === 0) {
        container.innerHTML = '<div style="color: var(--text-dim); font-size: 0.9em;">Keine Arcs vorhanden</div>';
        return;
    }
    
    container.innerHTML = arcs.map(a => `
        <div class="story-arc-item" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--bg-dark); border-radius: 4px; margin-bottom: 4px;">
            <span style="width: 16px; height: 16px; background: ${a.color || 'var(--gold)'}; border-radius: 3px;"></span>
            <span style="flex: 1; color: var(--text);">${esc(a.name)}</span>
            <span style="color: var(--text-dim); font-size: 0.8em;">${countSessionsInArc(a.id)} Sessions</span>
            <button class="btn btn-sm btn-danger" data-action="delete-story-arc" data-id="${a.id}" title="Löschen">🗑️</button>
        </div>
    `).join('');
}

function countSessionsInArc(arcId) {
    return (D.sessionNotes || []).filter(n => n.arcId === arcId).length;
}

function addStoryArc() {
    const name = $('new-arc-name')?.value.trim();
    const color = $('new-arc-color')?.value || '#d4af37';
    
    if (!name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }
    
    const arcs = getStoryArcs();
    arcs.push({
        id: Date.now(),
        name: name,
        color: color,
        order: arcs.length
    });
    
    $('new-arc-name').value = '';
    save();
    renderStoryArcList();
    renderStoryArcSelects();
    showToast('📚 Arc erstellt');
}

function deleteStoryArc(id) {
    if (!confirm('Arc löschen? Sessions bleiben erhalten.')) return;

    pushUndo('Story Arc gelöscht');
    D.storyArcs = D.storyArcs.filter(a => a.id !== id);
    
    // Sessions von diesem Arc lösen
    (D.sessionNotes || []).forEach(n => {
        if (n.arcId === id) n.arcId = null;
    });
    
    save();
    renderStoryArcList();
    renderStoryArcSelects();
    renderSessions();
    showToast('Arc gelöscht');
}

// SESSION TAGS
// ============================================================
function getAllSessionTags() {
    const tags = new Set();
    (D.sessionNotes || []).forEach(n => {
        (n.tags || []).forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
}

function renderSessionTagFilters() {
    const container = $('filter-session-tags');
    if (!container) return;
    
    const allTags = getAllSessionTags();
    if (allTags.length === 0) {
        container.innerHTML = '<span style="color: var(--text-dim); font-size: 0.8em;">Keine Tags</span>';
        return;
    }
    
    container.innerHTML = allTags.map(tag => `
        <button class="session-filter-tag ${activeTagFilters.includes(tag) ? 'active' : ''}" 
                data-action="toggle-session-tag-filter" data-value="${esc(tag)}">
            ${esc(tag)}
        </button>
    `).join('');
}

function toggleSessionTagFilter(tag) {
    const idx = activeTagFilters.indexOf(tag);
    if (idx > -1) {
        activeTagFilters.splice(idx, 1);
    } else {
        activeTagFilters.push(tag);
    }
    renderSessionTagFilters();
    renderSessions();
}

function renderCurrentSessionTags() {
    const container = $('session-tags-container');
    if (!container) return;
    
    container.innerHTML = currentSessionTags.map(tag => `
        <span class="session-tag">
            ${esc(tag)}
            <span class="session-tag-remove" data-action="remove-session-tag" data-value="${esc(tag)}">×</span>
        </span>
    `).join('');
}

function addSessionTag(tag) {
    tag = tag.toLowerCase().trim().replace(/[^a-zäöüß0-9-]/g, '');
    if (!tag || currentSessionTags.includes(tag)) return;
    
    currentSessionTags.push(tag);
    renderCurrentSessionTags();
    $('session-tags-input').value = '';
}

function removeSessionTag(tag) {
    currentSessionTags = currentSessionTags.filter(t => t !== tag);
    renderCurrentSessionTags();
}

function addPresetTag(tag) {
    addSessionTag(tag);
}

// SESSION NUMBER
// ============================================================
function getNextSessionNumber() {
    const sessions = D.sessionNotes || [];
    if (sessions.length === 0) return 1;
    
    const maxNum = Math.max(...sessions.map(s => s.number || 0));
    return maxNum + 1;
}

// RENDER SESSIONS
// ============================================================
function renderSessions() {
    const c = $('session-list'); if (!c) return;
    const search = ($('notes-search')?.value || '').toLowerCase();
    const arcFilter = $('filter-session-arc')?.value || '';
    
    let notes = [...(D.sessionNotes || [])];
    
    // Suche anwenden
    if (search) {
        notes = notes.filter(n => {
            const content = (n.content || '').toLowerCase().replace(/<[^>]+>/g, '');
            const date = (n.date || '').toLowerCase();
            const name = (n.name || '').toLowerCase();
            const summary = (n.summary || '').toLowerCase();
            const tags = (n.tags || []).join(' ').toLowerCase();
            return content.includes(search) || date.includes(search) || 
                   name.includes(search) || summary.includes(search) || tags.includes(search);
        });
    }
    
    // Arc-Filter anwenden
    if (arcFilter) {
        notes = notes.filter(n => n.arcId === parseInt(arcFilter));
    }
    
    // Tag-Filter anwenden
    if (activeTagFilters.length > 0) {
        notes = notes.filter(n => {
            const noteTags = n.tags || [];
            return activeTagFilters.some(t => noteTags.includes(t));
        });
    }
    
    // Counter aktualisieren
    updateCounters({ 'notes-io-count': notes.length });
    
    // Tag-Filter rendern
    renderSessionTagFilters();
    
    if (!notes.length) { 
        c.innerHTML = renderEmptyState({
            icon: '📝',
            titleEmpty: 'Keine Notizen',
            titleFiltered: 'Keine Treffer',
            descEmpty: 'Dokumentiere deine Sessions und wichtige Ereignisse.',
            descFiltered: 'Versuche andere Filter oder Suchbegriffe.',
            isFiltered: !!(search || arcFilter || activeTagFilters.length)
        });
        return; 
    }
    
    // Nach Arcs gruppieren wenn kein Arc-Filter aktiv
    const arcs = getStoryArcs();
    const groupByArc = !arcFilter && arcs.length > 0;
    
    if (groupByArc) {
        // Nach Arc gruppieren
        const grouped = {};
        const noArc = [];
        
        notes.forEach(n => {
            if (n.arcId) {
                if (!grouped[n.arcId]) grouped[n.arcId] = [];
                grouped[n.arcId].push(n);
            } else {
                noArc.push(n);
            }
        });
        
        // Sortieren innerhalb der Gruppen
        Object.values(grouped).forEach(arr => arr.sort((a, b) => (b.number || 0) - (a.number || 0)));
        noArc.sort((a, b) => (b.number || 0) - (a.number || 0));
        
        let html = '';
        
        // Arcs rendern
        arcs.forEach(arc => {
            const arcNotes = grouped[arc.id] || [];
            if (arcNotes.length === 0) return;
            
            html += `
                <div class="session-arc-group">
                    <div class="session-arc-header" data-action="toggle-arc-group" data-id="${arc.id}">
                        <span style="width: 12px; height: 12px; background: ${arc.color || 'var(--gold)'}; border-radius: 2px;"></span>
                        <span class="session-arc-title">${esc(arc.name)}</span>
                        <span class="session-arc-count">${arcNotes.length} Sessions</span>
                        <span class="session-arc-toggle">▼</span>
                    </div>
                    <div class="session-arc-sessions" id="arc-sessions-${arc.id}">
                        ${arcNotes.map(n => renderSessionCard(n)).join('')}
                    </div>
                </div>
            `;
        });
        
        // Sessions ohne Arc
        if (noArc.length > 0) {
            html += `
                <div class="session-arc-group">
                    <div class="session-arc-header" data-action="toggle-arc-group" data-id="none">
                        <span style="width: 12px; height: 12px; background: var(--text-dim); border-radius: 2px;"></span>
                        <span class="session-arc-title" style="color: var(--text-dim);">Ohne Arc</span>
                        <span class="session-arc-count">${noArc.length} Sessions</span>
                        <span class="session-arc-toggle">▼</span>
                    </div>
                    <div class="session-arc-sessions" id="arc-sessions-none">
                        ${noArc.map(n => renderSessionCard(n)).join('')}
                    </div>
                </div>
            `;
        }
        
        c.innerHTML = html;
    } else {
        // Flache Liste (nach Nummer sortiert)
        notes.sort((a, b) => (b.number || 0) - (a.number || 0));
        c.innerHTML = notes.map(n => renderSessionCard(n)).join('');
    }
}

function renderSessionCard(n) {
    const tagsHtml = (n.tags || []).map(t => 
        `<span class="session-tag" style="font-size: 0.75em;">${esc(t)}</span>`
    ).join('');
    
    return `
        <div class="session-card">
            <div class="session-card-header">
                <div class="session-number">#${n.number || '?'}</div>
                <div class="session-info">
                    <div class="session-title">${esc(n.name) || 'Unbenannte Session'}</div>
                    <div class="session-date">${formatDate(n.date)}</div>
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm" data-action="toggle-session-content" data-id="${n.id}" title="Auf-/Zuklappen">📖</button>
                    <button class="btn btn-sm" data-action="edit-session" data-id="${n.id}" title="Bearbeiten">✏️</button>
                    <button class="btn btn-sm btn-danger" data-action="delete-session" data-id="${n.id}" title="Löschen">🗑️</button>
                </div>
            </div>
            ${n.summary ? `<div class="session-summary">${esc(n.summary)}</div>` : ''}
            ${tagsHtml ? `<div class="session-tags">${tagsHtml}</div>` : ''}
            <div class="session-content collapsed" id="session-content-${n.id}">${sanitizeHTML(n.content) || ''}</div>
        </div>
    `;
}

function toggleSessionContent(id) {
    const content = $(`session-content-${id}`);
    if (content) {
        content.classList.toggle('collapsed');
    }
}

function toggleArcGroup(id) {
    const sessions = $(`arc-sessions-${id}`);
    const header = sessions?.previousElementSibling;
    const toggle = header?.querySelector('.session-arc-toggle');
    
    if (sessions) {
        sessions.classList.toggle('collapsed');
        if (toggle) {
            toggle.textContent = sessions.classList.contains('collapsed') ? '▶' : '▼';
        }
    }
}

// SAVE SESSION
// ============================================================
function saveSession() {
    const editId = $('edit-session-id').value;
    const number = parseInt($('session-number')?.value) || getNextSessionNumber();
    const name = $('session-name').value.trim();
    const date = $('session-date').value;
    const arcId = $('session-arc')?.value ? parseInt($('session-arc').value) : null;
    const summary = $('session-summary')?.value.trim() || '';
    const tags = [...currentSessionTags];
    const content = sanitizeHTML($('session-text').innerHTML);
    
    if (!date || !content.trim()) { 
        showToast('⚠️ Datum und Text erforderlich', 'error'); 
        return; 
    }
    
    if (editId) {
        // Bearbeiten
        const idx = D.sessionNotes.findIndex(n => n.id === parseInt(editId));
        if (idx > -1) {
            D.sessionNotes[idx] = { 
                ...D.sessionNotes[idx], 
                number, name, date, arcId, summary, tags, content 
            };
            showToast('Notiz aktualisiert');
        }
    } else {
        // Neu erstellen
        D.sessionNotes.push({ 
            id: nextId('sessionNotes'), 
            number, name, date, arcId, summary, tags, content 
        });
        showToast('Notiz gespeichert');
    }
    
    cancelSessionEdit();
    renderSessions();
    renderStoryArcSelects();
    save();
}

function editSession(id) {
    const note = EntityLookup.sessionNote(id);
    if (!note) return;

    // Arc-Dropdown aktualisieren bevor Wert gesetzt wird
    renderStoryArcSelects();

    $('edit-session-id').value = id;
    if ($('session-number')) $('session-number').value = note.number || '';
    $('session-name').value = note.name || '';
    $('session-date').value = note.date;
    if ($('session-arc')) $('session-arc').value = note.arcId || '';
    if ($('session-summary')) $('session-summary').value = note.summary || '';
    $('session-text').innerHTML = sanitizeHTML(note.content) || '';
    
    // Tags laden
    currentSessionTags = [...(note.tags || [])];
    renderCurrentSessionTags();
    
    $('session-form-title').textContent = '✏️ Notiz bearbeiten';
    
    // Formular aufklappen
    $('session-form').classList.add('open');
    $('session-form-icon').textContent = '▲';
    
    // Zum Formular scrollen
    $('session-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelSessionEdit() {
    $('edit-session-id').value = '';
    if ($('session-number')) $('session-number').value = '';
    $('session-name').value = '';
    $('session-date').value = '';
    if ($('session-arc')) $('session-arc').value = '';
    if ($('session-summary')) $('session-summary').value = '';
    $('session-text').innerHTML = '';
    
    currentSessionTags = [];
    renderCurrentSessionTags();
    
    $('session-form-title').textContent = '+ Neue Session-Notiz';
    
    // Formular einklappen
    $('session-form').classList.remove('open');
    $('session-form-icon').textContent = '▼';
    
    // Nächste Session-Nummer vorausfüllen
    const numInput = $('session-number');
    if (numInput) numInput.placeholder = getNextSessionNumber();
}

function deleteSession(id) {
    if (confirm('Session löschen?')) {
        pushUndo('Session gelöscht');
        D.sessionNotes = D.sessionNotes.filter(n => n.id !== id);
        renderSessions();
        save();
    }
}

// INIT
// ============================================================
function initSessionsEnhanced() {
    // Arc-Selects füllen
    renderStoryArcSelects();
    
    // Tag-Input Event
    const tagInput = $('session-tags-input');
    if (tagInput) {
        tagInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addSessionTag(tagInput.value);
            }
        });
    }
    
    // Nächste Session-Nummer vorausfüllen
    const numInput = $('session-number');
    if (numInput) {
        numInput.placeholder = getNextSessionNumber();
    }
}

// Auto-Init wenn DOM bereit
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSessionsEnhanced);
} else {
    setTimeout(initSessionsEnhanced, 100);
}

// ============================================================
