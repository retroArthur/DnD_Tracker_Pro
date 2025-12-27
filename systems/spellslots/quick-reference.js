// [SECTION:QUICK_REFERENCE]
// Extrahiert aus spellslots.js
// Schnell-Referenz Panel
// Zeilen: 136

// SCHNELL-REFERENZ PANEL
// ============================================================
function toggleQuickRef() {
    const panel = $('quick-ref-panel');
    if (panel) {
        panel.classList.toggle('open');
    }
}

function toggleQuickRefSection(sectionEl, evt) {
    // Verhindere dass der Click auf dem Content das Toggle auslöst
    const e = evt || window.event;
    if (e && e.target && e.target.closest('.quick-ref-section-content')) return;
    sectionEl.classList.toggle('expanded');
}

// ============================================================
// SCHNELL-REFERENZ BENUTZERDEFINIERTE EINTRÄGE
// ============================================================

function initQuickRefCustom() {
    // Initialisiere quickRefCustom Array falls nicht vorhanden
    if (!D.quickRefCustom) D.quickRefCustom = [];
    renderQuickRefCustom();
}

function renderQuickRefCustom() {
    const container = $('quick-ref-custom');
    if (!container) return;
    
    if (!D.quickRefCustom || D.quickRefCustom.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = D.quickRefCustom.map(entry => {
        const isExpanded = entry.expanded ? 'expanded' : '';
        // Parse Entity-Links im Content
        const content = parseEntityLinks(entry.content || '');
        
        return `
        <div class="quick-ref-section quick-ref-custom-entry ${isExpanded}" data-id="${entry.id}">
            <div class="quick-ref-section-title" data-action="toggle-quick-ref-custom" data-id="${entry.id}">
                <span>📌 ${esc(entry.title)}</span>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <button class="btn btn-sm" data-action="edit-quick-ref-entry" data-id="${entry.id}" data-stop-propagation="true" title="Bearbeiten">✏️</button>
                    <button class="btn btn-sm btn-danger" data-action="delete-quick-ref-entry" data-id="${entry.id}" data-stop-propagation="true" title="Löschen">🗑️</button>
                    <span class="quick-ref-toggle-arrow">▼</span>
                </div>
            </div>
            <div class="quick-ref-section-content">
                <div class="quick-ref-custom-content">${content}</div>
            </div>
        </div>`;
    }).join('');
    
    // Separator wenn es benutzerdefinierte Einträge gibt
    if (D.quickRefCustom.length > 0) {
        container.innerHTML += '<div class="quick-ref-separator"><span>📚 Standard-Referenz</span></div>';
    }
}

function addQuickRefEntry() {
    $('quick-ref-edit-id').value = '';
    $('quick-ref-entry-title').value = '';
    $('quick-ref-entry-content').innerHTML = '';
    $('quick-ref-modal-title').textContent = 'Eintrag hinzufügen';
    showModal('quick-ref-entry-modal');
    setTimeout(() => $('quick-ref-entry-title').focus(), 100);
}

function editQuickRefEntry(id) {
    const entry = D.quickRefCustom?.find(e => e.id === id);
    if (!entry) return;
    
    $('quick-ref-edit-id').value = id;
    $('quick-ref-entry-title').value = entry.title || '';
    $('quick-ref-entry-content').innerHTML = entry.content || '';
    $('quick-ref-modal-title').textContent = 'Eintrag bearbeiten';
    showModal('quick-ref-entry-modal');
}

function saveQuickRefEntry() {
    const id = $('quick-ref-edit-id').value;
    const title = $('quick-ref-entry-title').value.trim();
    const content = sanitizeHTML($('quick-ref-entry-content').innerHTML);
    
    if (!title) {
        showToast('⚠️ Titel erforderlich', 'error');
        return;
    }
    
    if (!D.quickRefCustom) D.quickRefCustom = [];
    
    if (id) {
        // Bearbeiten
        const idx = D.quickRefCustom.findIndex(e => e.id === parseInt(id));
        if (idx > -1) {
            D.quickRefCustom[idx].title = title;
            D.quickRefCustom[idx].content = content;
        }
    } else {
        // Neu
        D.quickRefCustom.push({
            id: nextId('quickRefCustom'),
            title: title,
            content: content,
            expanded: true
        });
    }
    
    hideModal('quick-ref-entry-modal');
    renderQuickRefCustom();
    save();
    showToast('📌 Eintrag gespeichert');
}

function deleteQuickRefEntry(id) {
    if (!confirm('Eintrag wirklich löschen?')) return;
    
    D.quickRefCustom = (D.quickRefCustom || []).filter(e => e.id !== id);
    renderQuickRefCustom();
    save();
    showToast('🗑️ Eintrag gelöscht');
}

function toggleQuickRefCustomEntry(id) {
    const entry = D.quickRefCustom?.find(e => e.id === id);
    if (entry) {
        entry.expanded = !entry.expanded;
        renderQuickRefCustom();
        save();
    }
}

// ============================================================
