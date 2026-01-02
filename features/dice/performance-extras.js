// [SECTION:PERFORMANCE_EXTRAS]
// Extrahiert aus dice.js
// Performance-Optimierungen
// Zeilen: 341

// PERFORMANCE OPTIMIERUNGEN
// ============================================================
// Debounced Render für häufige Updates (zusätzlich zu den bei SPELLS definierten)
const debouncedRenderParty = debounce(() => renderParty(), 100);
const debouncedRenderQuests = debounce(() => renderQuests(), 100);

// Intersection Observer für Lazy Loading
const lazyLoadObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            if (el.dataset.lazySrc) {
                el.src = el.dataset.lazySrc;
                delete el.dataset.lazySrc;
                lazyLoadObserver.unobserve(el);
            }
        }
    });
}, { rootMargin: '100px' });

function toggleMobileNav() {
    const header = document.querySelector('.app-header');
    if (header) {
        header.classList.toggle('nav-open');
    }
}

function showMobileQuickNotes() {
    let modal = $('mobile-quicknotes-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'mobile-quicknotes-modal';
        modal.innerHTML = `
            <div class="modal" style="max-width: 95%; margin-top: 20px;">
                <div class="modal-header">
                    <span class="modal-title">📝 Schnellnotizen</span>
                    <button class="btn btn-sm" data-action="hide-modal" data-value="mobile-quicknotes-modal">✕</button>
                </div>
                <div class="form-group">
                    <textarea id="mobile-quick-notes" rows="12" placeholder="Schnelle Notizen..." 
                              style="font-size: 16px; width: 100%; padding: 12px; background: var(--bg-dark); border: 1px solid var(--border); color: var(--text); border-radius: 8px; resize: vertical;"></textarea>
                </div>
                <button class="btn btn-success" data-action="call" data-value="saveMobileQuickNotes" style="width: 100%;">💾 Speichern</button>
            </div>
        `;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal('mobile-quicknotes-modal');
        });
        document.body.appendChild(modal);
    }
    // Lade aktuelle Notizen
    const textarea = $('mobile-quick-notes');
    if (textarea) textarea.value = D.quickNotes || '';
    showModal('mobile-quicknotes-modal');
    setTimeout(() => $('mobile-quick-notes')?.focus(), 100);
}

function saveMobileQuickNotes() {
    const notes = $('mobile-quick-notes')?.value || '';
    D.quickNotes = notes;
    // Sync mit Desktop-Textarea
    if ($('quick-notes')) $('quick-notes').value = notes;
    save();
    showToast('📝 Notizen gespeichert');
    hideModal('mobile-quicknotes-modal');
}

function showMobileSearch() {
    // Modal für mobile Suche
    let modal = $('mobile-search-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'mobile-search-modal';
        modal.innerHTML = `
            <div class="modal" style="max-width: 95%; margin-top: 20px;">
                <div class="modal-header">
                    <span class="modal-title">🔍 Suche</span>
                    <button class="btn btn-sm" data-action="hide-modal" data-value="mobile-search-modal">✕</button>
                </div>
                <div class="form-group">
                    <input type="text" id="mobile-search-input" placeholder="NPCs, Orte, Quests..." 
                           oninput="performMobileSearch()" autofocus style="font-size: 16px;">
                </div>
                <div id="mobile-search-results" style="max-height: 60vh; overflow-y: auto;"></div>
            </div>
        `;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal('mobile-search-modal');
        });
        document.body.appendChild(modal);
    }
    showModal('mobile-search-modal');
    setTimeout(() => $('mobile-search-input')?.focus(), 100);
}

function performMobileSearch() {
    const query = $('mobile-search-input').value.trim();
    const results = $('mobile-search-results');
    
    if (!query || query.length < 2) {
        results.innerHTML = '<div style="color: var(--text-dim); padding: 20px; text-align: center;">Mindestens 2 Zeichen eingeben</div>';
        return;
    }
    
    const matches = [];
    
    // Fuzzy search in all entities
    D.characters.forEach(c => {
        const score = fuzzySearchFields(c, query, ['name', 'playerName', 'characterClass']);
        if (score > 0) matches.push({ type: 'character', name: c.name, detail: c.characterClass || '', id: c.id, score });
    });
    
    D.npcs.forEach(n => {
        const score = fuzzySearchFields(n, query, ['name', 'role', 'description']);
        if (score > 0) matches.push({ type: 'npc', name: n.name, detail: n.role || '', id: n.id, locId: n.locationId, score });
    });
    
    D.locations.forEach(l => {
        const score = fuzzySearchFields(l, query, ['name', 'type', 'description']);
        if (score > 0) matches.push({ type: 'location', name: l.name, detail: l.type || '', id: l.id, score });
    });
    
    D.quests.forEach(q => {
        const score = fuzzySearchFields(q, query, ['title', 'description', 'giver']);
        if (score > 0) matches.push({ type: 'quest', name: q.title, detail: q.completed ? '✓' : '', id: q.id, score });
    });
    
    matches.sort((a, b) => b.score - a.score);
    
    if (matches.length === 0) {
        results.innerHTML = '<div style="color: var(--text-dim); padding: 20px; text-align: center;">Keine Treffer für "' + esc(query) + '"</div>';
    } else {
        results.innerHTML = matches.slice(0, 15).map(m => `
            <div style="padding: 12px; border-bottom: 1px solid var(--border); cursor: pointer;" 
                 data-action="mobile-search-navigate" data-type="${m.type}" data-id="${m.id}" data-loc="${m.locId || 'null'}">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.2em;">${getTypeIcon(m.type)}</span>
                    <div>
                        <div style="font-weight: 500;">${highlightMatch(m.name, query)}</div>
                        <div style="font-size: 0.85em; color: var(--text-dim);">${m.detail}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// ============================================================
// DRAG AND DROP SORTING
// ============================================================
let draggedItem = null;
let draggedList = null;

function handleDragStart(e) {
    const item = e.target.closest('[data-sortable]');
    if (!item) return;
    
    draggedItem = item;
    draggedList = item.parentElement;
    
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.dataset.id);
    
    // Ghost-Image reduzieren
    setTimeout(() => item.style.opacity = '0.4', 0);
}

function handleDragEnd(e) {
    const item = e.target.closest('[data-sortable]');
    if (!item) return;
    
    item.classList.remove('dragging');
    item.style.opacity = '1';
    
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    
    draggedItem = null;
    draggedList = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const target = e.target.closest('[data-sortable]');
    if (!target || target === draggedItem) return;
    
    // Highlight
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    target.classList.add('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    
    const target = e.target.closest('[data-sortable]');
    if (!target || !draggedItem || target === draggedItem) return;
    
    const container = target.parentElement;
    const items = [...container.querySelectorAll('[data-sortable]')];
    const draggedIndex = items.indexOf(draggedItem);
    const targetIndex = items.indexOf(target);
    
    // DOM neu ordnen
    if (draggedIndex < targetIndex) {
        target.after(draggedItem);
    } else {
        target.before(draggedItem);
    }
    
    // Daten neu ordnen
    const dataKey = container.dataset.sortableList;
    if (dataKey && D[dataKey]) {
        const draggedId = parseEntityId(draggedItem.dataset.id);
        const targetId = parseEntityId(target.dataset.id);
        
        const dataArray = D[dataKey];
        const draggedData = dataArray.find(x => x.id === draggedId);
        const targetData = dataArray.find(x => x.id === targetId);
        
        if (draggedData && targetData) {
            const oldIndex = dataArray.indexOf(draggedData);
            const newIndex = dataArray.indexOf(targetData);
            
            dataArray.splice(oldIndex, 1);
            dataArray.splice(newIndex, 0, draggedData);
            
            save();
            showToast('📋 Reihenfolge geändert');
        }
    }
    
    target.classList.remove('drag-over');
}
function renderDashboard() {
    const c = $('dashboard-content'); if (!c) return;
    
    const charCount = D.characters?.length || 0;
    const npcCount = D.npcs?.length || 0;
    const locCount = D.locations?.length || 0;
    const questCount = D.quests?.length || 0;
    const activeQuests = D.quests?.filter(q => q.status !== 'completed')?.length || 0;
    const spellCount = D.spells?.length || 0;
    const lootCount = D.loot?.length || 0;
    const sessionCount = D.sessionNotes?.length || 0;
    
    // Party Health Overview
    const partyHealth = D.characters?.map(ch => {
        const pct = ch.hpMax > 0 ? (ch.hpCurrent / ch.hpMax) * 100 : 100;
        const status = pct <= 25 ? 'critical' : pct <= 50 ? 'bloodied' : 'healthy';
        const conditions = ch.conditions?.length || 0;
        return { id: ch.id, name: ch.name, pct, status, conditions, avatar: ch.avatar, hp: ch.hpCurrent, hpMax: ch.hpMax };
    }) || [];
    
    // Recent Sessions (with number support)
    const recentSessions = (D.sessionNotes || []).slice(-4).reverse();
    
    // Tracked Quests
    const trackedQuestList = (D.quests || []).filter(q => q.tracked && !q.completed).slice(0, 4);
    
    // Active timers (if any)
    const activeTimers = typeof timers !== 'undefined' ? timers.filter(t => t.running) : [];
    const focusedTimer = activeTimers.length > 0 ? activeTimers[0] : null;
    
    c.innerHTML = `
        <!-- Party Overview -->
        <div class="dash-party">
            <div class="dash-party-title">👥 Party Status</div>
            ${partyHealth.length ? `
                <div class="dash-party-grid">
                    ${partyHealth.map(ch => `
                        <div class="dash-char ${ch.status}" data-action="show-view" data-value="party">
                            ${ch.conditions > 0 ? `<span class="dash-char-conditions">${ch.conditions}</span>` : ''}
                            <div class="dash-char-avatar">
                                ${ch.avatar ? `<img src="${esc(ch.avatar)}" alt="">` : '👤'}
                            </div>
                            <div class="dash-char-name">${esc(ch.name)}</div>
                            <div class="dash-char-hp">
                                <div class="dash-char-hp-bar ${ch.status}" style="width: ${Math.max(0, Math.min(100, ch.pct))}%"></div>
                            </div>
                            <div class="dash-char-hp-text">${ch.hp}/${ch.hpMax}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="dash-party-actions">
                    <button class="dash-quick-btn primary" data-action="show-view" data-value="initiative">⚔️ Kampf starten</button>
                    <button class="dash-quick-btn" data-action="show-view" data-value="encounter">👹 Begegnung</button>
                </div>
            ` : `
                <div class="dash-party-empty">
                    <div style="font-size: 2em; margin-bottom: 8px;">👥</div>
                    <div>Keine Charaktere vorhanden</div>
                    <button class="btn btn-sm" style="margin-top: 10px;" data-action="show-view" data-value="party">+ Charakter erstellen</button>
                </div>
            `}
        </div>
        
        <!-- Stats Row -->
        <div class="dash-stats">
            <div class="dash-stat" data-action="show-view" data-value="party">
                <div class="dash-stat-value">${charCount}</div>
                <div class="dash-stat-label">Party</div>
            </div>
            <div class="dash-stat" data-action="show-view" data-value="npcs">
                <div class="dash-stat-value">${npcCount}</div>
                <div class="dash-stat-label">NPCs</div>
            </div>
            <div class="dash-stat" data-action="show-view" data-value="locations">
                <div class="dash-stat-value">${locCount}</div>
                <div class="dash-stat-label">Orte</div>
            </div>
            <div class="dash-stat" data-action="show-view" data-value="quests">
                <div class="dash-stat-value">${activeQuests}</div>
                <div class="dash-stat-label">Quests</div>
            </div>
            <div class="dash-stat" data-action="show-view" data-value="spells">
                <div class="dash-stat-value">${spellCount}</div>
                <div class="dash-stat-label">Zauber</div>
            </div>
            <div class="dash-stat" data-action="show-view" data-value="loot">
                <div class="dash-stat-value">${lootCount}</div>
                <div class="dash-stat-label">Loot</div>
            </div>
            <div class="dash-stat" data-action="show-view" data-value="notes">
                <div class="dash-stat-value">${sessionCount}</div>
                <div class="dash-stat-label">Sessions</div>
            </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="dash-quick">
            <button class="dash-quick-btn" data-action="show-view" data-value="dice">🎲 Würfeln</button>
            <button class="dash-quick-btn" data-action="show-view" data-value="spells">✨ Zauber</button>
            <button class="dash-quick-btn" data-action="show-view" data-value="timers">⏱️ Timer</button>
            <button class="dash-quick-btn" data-action="show-view" data-value="maps">🗺️ Karten</button>
            <button class="dash-quick-btn" data-action="show-generator-modal">🎭 Generator</button>
        </div>
        
        <!-- Two Column Layout -->
        <div class="dash-columns">
            <!-- Tracked Quests -->
            <div class="dash-card">
                <div class="dash-card-header">
                    <span class="dash-card-title">📌 Verfolgte Quests</span>
                    <span class="dash-card-link" data-action="show-view" data-value="quests">Alle →</span>
                </div>
                <div class="dash-card-content">
                    ${trackedQuestList.length ? trackedQuestList.map(q => `
                        <div class="dash-quest" data-action="navigate-to-quest" data-id="${q.id}">
                            <span class="dash-quest-pin">📌</span>
                            <span class="dash-quest-title">${esc(q.title || q.name)}</span>
                            <span class="dash-quest-type ${q.type || 'quest'}">${q.type === 'plot' ? 'Plot' : q.type === 'side' ? 'Side' : 'Quest'}</span>
                        </div>
                    `).join('') : `
                        <div class="dash-empty">
                            <div>📌 Keine Quests verfolgt</div>
                            <div style="font-size: 0.85em; margin-top: 4px;">Klicke bei einer Quest auf 📌</div>
                        </div>
                    `}
                </div>
            </div>
            
            <!-- Recent Sessions -->
            <div class="dash-card">
                <div class="dash-card-header">
                    <span class="dash-card-title">📝 Sessions</span>
                    <span class="dash-card-link" data-action="show-view" data-value="notes">Alle →</span>
                </div>
                <div class="dash-card-content">
                    ${recentSessions.length ? recentSessions.map(s => `
                        <div class="dash-session" data-action="show-view" data-value="notes">
                            <span class="dash-session-num">${s.number ? '#' + s.number : '•'}</span>
                            <span class="dash-session-title">${esc(s.name || s.title || 'Session')}</span>
                            <span class="dash-session-date">${s.date ? formatDate(s.date) : ''}</span>
                        </div>
                    `).join('') : `
                        <div class="dash-empty">
                            <div>📝 Keine Sessions</div>
                            <div style="font-size: 0.85em; margin-top: 4px;">Erstelle deine erste Session-Notiz</div>
                        </div>
                    `}
                </div>
            </div>
        </div>
        
        ${focusedTimer ? `
            <!-- Active Timer Widget -->
            <div class="dash-timer">
                <div class="dash-timer-ring">
                    <svg viewBox="0 0 32 32">
                        <circle class="ring-bg" cx="16" cy="16" r="14"/>
                        <circle class="ring-progress" cx="16" cy="16" r="14" style="stroke-dashoffset: ${88 * (1 - focusedTimer.remainingSeconds / focusedTimer.totalSeconds)}"/>
                    </svg>
                </div>
                <div class="dash-timer-info">
                    <div class="dash-timer-name">${esc(focusedTimer.name)}</div>
                    <div class="dash-timer-time">${formatTime(focusedTimer.remainingSeconds)}</div>
                </div>
                <button class="dash-timer-btn" data-action="toggle-timer" data-id="${focusedTimer.id}">${focusedTimer.running ? '⏸' : '▶'}</button>
                <button class="dash-timer-btn" data-action="show-view" data-value="timers">→</button>
            </div>
        ` : ''}
    `;
}