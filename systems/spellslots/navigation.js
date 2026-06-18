// [SECTION:NAVIGATION]
// Extrahiert aus spellslots.js
// Navigation
// Zeilen: 66
// NAVIGATION
// ============================================================
function switchView(name) {
    // Cleanup: transientes NPC-Generator-Modal beim View-Wechsel entfernen
    const _npcgModal = document.getElementById('npc-generator-modal');
    if (_npcgModal) _npcgModal.remove();

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
    });
    $('view-' + name)?.classList.add('active');
    const activeTab = document.querySelector(`[data-view="${name}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-selected', 'true');
    }
    // LEGACY SUPPORT: Keep existing special cases for backwards compatibility
    if (name === 'notes') {
        const sessionDate = $('session-date');
        if (sessionDate) sessionDate.value = new Date().toISOString().split('T')[0];
    }
    // NEW: Use tab registry to render content
    const renderTabContent = window.renderTabContent;
    if (renderTabContent) renderTabContent(name);
    // Mobile: Navigation schließen und Label aktualisieren
    const header = document.querySelector('.app-header');
    if (header) header.classList.remove('nav-open');
    // View-Name in Toggle-Bar aktualisieren
    const toggleText = document.querySelector('.mobile-nav-toggle-text');
    if (toggleText) {
        const viewNames = {
            dashboard: '🏠 Start',
            party: '👥 Party',
            npcs: '🎭 NPCs',
            locations: '🏠 Orte',
            quests: '📜 Quests',
            encounter: '👹 Encounter',
            initiative: '⚔️ Initiative',
            loot: '📦 Truhe',
            shops: '🏪 Shops',
            spells: '✨ Zauber',
            notes: '📝 Notizen',
            wiki: '📚 Wiki',
            links: '🔗 Links',
            dice: '🎲 Würfel',
            timers: '⏱️ Timer',
            data: '💾 Daten',
            dmscreen: '🎮 DM Screen'
        };
        toggleText.textContent = viewNames[name] || '📍 Navigation';
    }
}
function showModal(id) {
    const modal = $(id);
    if (modal) modal.classList.add('show');
    const populateSelects = window.populateSelects;
    if (populateSelects) populateSelects();
    if (id === 'timer-preset-modal') {
        const renderPresetList = window.renderPresetList;
        if (renderPresetList) renderPresetList();
    }
    if (id === 'quest-modal') {
        const populateQuestSelects = window.populateQuestSelects;
        if (populateQuestSelects) populateQuestSelects();
    }
}
function hideModal(id) {
    const modal = $(id);
    if (modal) modal.classList.remove('show');
}
function toggleCollapse(id) {
    const el = $(id);
    const icon = $(id + '-icon');
    if (el) {
        el.classList.toggle('open');
        if (icon) icon.textContent = el.classList.contains('open') ? '▲' : '▼';
        // Story-Arc Dropdown aktualisieren wenn Session-Formular geöffnet wird
        if (
            id === 'session-form' &&
            el.classList.contains('open') &&
            typeof window.renderStoryArcSelects === 'function'
        ) {
            window.renderStoryArcSelects();
        }
    }
}
function showQuickNotesModal() {
    const D = window.D;
    const quickNotes = $('quick-notes');
    if (quickNotes) quickNotes.value = D.quickNotes || '';
    const modal = $('quicknotes-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}
function hideQuickNotesModal() {
    const modal = $('quicknotes-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}
function saveQuickNotes() {
    const D = window.D;
    const quickNotes = $('quick-notes');
    if (quickNotes) D.quickNotes = quickNotes.value;
    const save = window.save;
    if (save) save();
    showToast('📝 Notizen gespeichert');
}
function populateSelects() {
    const D = window.D;
    const esc = window.esc;
    // Location select for NPCs
    const locSel = $('npc-location');
    if (locSel) {
        locSel.innerHTML =
            '<option value="">-- Ort --</option>' +
            (D.locations || [])
                .map(l => `<option value="${l.id}">${esc(l.name)}</option>`)
                .join('');
    }
    // Filter selects
    const filterOpts =
        '<option value="">-- Kein Filter --</option>' +
        (D.filters || []).map(f => `<option value="${f.id}">${esc(f.name)}</option>`).join('');
    ['loc-filter', 'npc-filter'].forEach(id => {
        const select = $(id);
        if (select) select.innerHTML = filterOpts;
    });
}
