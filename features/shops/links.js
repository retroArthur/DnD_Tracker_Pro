// [SECTION:LINKS]
// Extrahiert aus shops.js
// Link-Verwaltung
// Zeilen: 128

// LINKS
// ============================================================
function renderLinks() {
    const c = $('links-list'); if (!c) return;
    const search = ($('link-search')?.value || '').toLowerCase();
    const catFilter = $('link-filter')?.value || '';
    
    // Counter aktualisieren
    const countEl = $('links-io-count');
    if (countEl) countEl.textContent = D.links?.length || 0;
    
    let links = D.links || [];
    
    // Kategorie-Filter anwenden
    if (catFilter) {
        links = links.filter(l => l.category === catFilter);
    }
    
    // Suche anwenden
    if (search) {
        links = links.filter(l => 
            (l.title || '').toLowerCase().includes(search) ||
            (l.url || '').toLowerCase().includes(search) ||
            (l.description || '').toLowerCase().includes(search)
        );
    }
    
    if (!links.length) { 
        c.innerHTML = renderEmptyState({
            icon: '🔗',
            titleEmpty: 'Keine Links',
            descEmpty: 'Speichere nützliche Links zu Regeln, Tools und Karten.',
            buttonText: '+ Link hinzufügen',
            buttonAction: 'call',
            buttonValue: 'toggleLinkForm',
            isFiltered: !!(search || catFilter)
        });
        return; 
    }
    
    c.innerHTML = links.map(l => `<div class="link-card">
        <div class="link-icon">${LINK_CATS[l.category]?.split(' ')[0] || '🔗'}</div>
        <div class="link-info">
            <div class="link-title"><a href="${esc(l.url)}" target="_blank" style="color:inherit; text-decoration:none;">${esc(l.title)}</a></div>
            <div class="link-url">${esc(l.url)}</div>
            ${l.description ? `<div style="font-size:0.8em; color:var(--text-dim); margin-top:4px;">${esc(l.description)}</div>` : ''}
        </div>
        <div class="btn-group">
            <button class="btn btn-sm" data-action="edit-link" data-id="${l.id}" title="Bearbeiten">✏️</button>
            <button class="btn btn-sm btn-danger" data-action="delete-link" data-id="${l.id}" title="Löschen">🗑️</button>
        </div>
    </div>`).join('');
}

function toggleLinkForm() {
    const form = $('link-form-card');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
}

function saveLink() {
    const editId = $('edit-link-id').value;
    const title = $('link-title').value.trim();
    const url = $('link-url').value.trim();
    
    if (!title || !url) { showToast('⚠️ Titel und URL erforderlich', 'error'); return; }
    
    const linkData = {
        title,
        url,
        category: $('link-cat').value,
        description: sanitizeHTML($('link-desc').innerHTML)
    };
    
    if (editId) {
        const idx = D.links.findIndex(l => l.id === parseInt(editId));
        if (idx > -1) {
            D.links[idx] = { ...D.links[idx], ...linkData };
            showToast('Link aktualisiert');
        }
    } else {
        linkData.id = nextId('links');
        D.links.push(linkData);
        showToast('Link hinzugefügt');
    }
    
    cancelLinkEdit();
    renderLinks();
    save();
}

function editLink(id) {
    const link = EntityLookup.link(id);
    if (!link) return;
    
    $('edit-link-id').value = id;
    $('link-title').value = link.title || '';
    $('link-url').value = link.url || '';
    $('link-cat').value = link.category || 'other';
    $('link-desc').innerHTML = sanitizeHTML(link.description) || '';
    
    const form = $('link-form-card');
    if (form) form.style.display = 'block';
    
    $('link-title').focus();
}

function cancelLinkEdit() {
    $('edit-link-id').value = '';
    $('link-title').value = '';
    $('link-url').value = '';
    $('link-cat').value = 'rules';
    $('link-desc').innerHTML = '';
    
    const form = $('link-form-card');
    if (form) form.style.display = 'none';
}

function deleteLink(id) { 
    if (confirm('Löschen?')) { 
        D.links = D.links.filter(l => l.id !== id); 
        renderLinks(); 
        save(); 
    } 
}

// ============================================================