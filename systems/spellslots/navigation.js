// [SECTION:NAVIGATION]
// Extrahiert aus spellslots.js
// Navigation
// Zeilen: 66

// NAVIGATION
// ============================================================
function switchView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    $('view-' + name)?.classList.add('active');
    document.querySelector(`[data-view="${name}"]`)?.classList.add('active');
    if (name === 'notes') $('session-date').value = new Date().toISOString().split('T')[0];
    if (name === 'network') renderMindmap();
    
    // Mobile: Navigation schließen und Label aktualisieren
    const header = document.querySelector('.app-header');
    if (header) header.classList.remove('nav-open');
    
    // View-Name in Toggle-Bar aktualisieren
    const toggleText = document.querySelector('.mobile-nav-toggle-text');
    if (toggleText) {
        const viewNames = {
            'dashboard': '🏠 Start',
            'party': '👥 Party',
            'npcs': '🎭 NPCs',
            'locations': '🏠 Orte',
            'network': '🔗 Netzwerk',
            'quests': '📜 Quests',
            'encounter': '👹 Encounter',
            'initiative': '⚔️ Initiative',
            'loot': '📦 Truhe',
            'shops': '🏪 Shops',
            'spells': '✨ Zauber',
            'notes': '📝 Notizen',
            'wiki': '📚 Wiki',
            'links': '🔗 Links',
            'dice': '🎲 Würfel',
            'timers': '⏱️ Timer',
            'maps': '🗺️ Karten',
            'data': '💾 Daten'
        };
        toggleText.textContent = viewNames[name] || '📍 Navigation';
    }
}

function showModal(id) { 
    $(id).classList.add('show'); 
    populateSelects(); 
    if (id === 'timer-preset-modal') renderPresetList();
    if (id === 'quest-modal') populateQuestSelects();
}
function hideModal(id) { $(id).classList.remove('show'); }
function toggleCollapse(id) { const el = $(id), icon = $(id + '-icon'); el.classList.toggle('open'); if (icon) icon.textContent = el.classList.contains('open') ? '▲' : '▼'; }
function showQuickNotesModal() { 
    $('quick-notes').value = D.quickNotes || '';
    const modal = $('quicknotes-modal');
    modal.style.display = 'flex';
    modal.classList.add('show');
}
function hideQuickNotesModal() { 
    const modal = $('quicknotes-modal');
    modal.style.display = 'none';
    modal.classList.remove('show');
}
function saveQuickNotes() { D.quickNotes = $('quick-notes').value; save(); showToast('📝 Notizen gespeichert'); }

function populateSelects() {
    // Location select for NPCs
    const locSel = $('npc-location');
    if (locSel) locSel.innerHTML = '<option value="">-- Ort --</option>' + D.locations.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('');
    // Filter selects
    const filterOpts = '<option value="">-- Kein Filter --</option>' + D.filters.map(f => `<option value="${f.id}">${esc(f.name)}</option>`).join('');
    ['loc-filter', 'npc-filter'].forEach(id => { if ($(id)) $(id).innerHTML = filterOpts; });
}