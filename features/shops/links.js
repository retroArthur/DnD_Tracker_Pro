// [SECTION:LINKS]
// Extrahiert aus shops.js
// Link-Verwaltung
// Zeilen: 136
// LINKS
// ============================================================
function renderLinks() {
    const D = window.D;
    const LINK_CATS = window.LINK_CATS;
    const renderEmptyState = window.renderEmptyState;
    const c = $('links-list');
    if (!c)
        return;
    const searchInput = $('link-search');
    const catFilterInput = $('link-filter');
    const search = (searchInput?.value || '').toLowerCase();
    const catFilter = catFilterInput?.value || '';
    // Counter aktualisieren
    const countEl = $('links-io-count');
    if (countEl)
        countEl.textContent = String(D.links?.length || 0);
    let links = D.links || [];
    // Kategorie-Filter anwenden
    if (catFilter) {
        links = links.filter((l) => l.category === catFilter);
    }
    // Suche anwenden
    if (search) {
        links = links.filter((l) => (l.title || '').toLowerCase().includes(search) ||
            (l.url || '').toLowerCase().includes(search) ||
            (l.description || '').toLowerCase().includes(search));
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
    c.innerHTML = links.map((l) => `<div class="link-card">
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
        const htmlForm = form;
        htmlForm.style.display = htmlForm.style.display === 'none' ? 'block' : 'none';
    }
}
function saveLink() {
    const D = window.D;
    const nextId = window.nextId;
    const editIdInput = $('edit-link-id');
    const titleInput = $('link-title');
    const urlInput = $('link-url');
    const catInput = $('link-cat');
    const descInput = $('link-desc');
    const editId = editIdInput?.value || '';
    const title = titleInput?.value.trim() || '';
    const url = urlInput?.value.trim() || '';
    if (!title || !url) {
        showToast('⚠️ Titel und URL erforderlich', 'error');
        return;
    }
    const linkData = {
        title,
        url,
        category: catInput?.value || 'other',
        description: descInput ? sanitizeHTML(descInput.innerHTML) : ''
    };
    pushUndo(editId ? 'Link bearbeitet' : 'Link erstellt');
    if (editId) {
        const idx = D.links.findIndex((l) => l.id === parseInt(editId));
        if (idx > -1) {
            D.links[idx] = { ...D.links[idx], ...linkData };
            showToast('Link aktualisiert');
        }
    }
    else {
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
    if (!link)
        return;
    const editIdInput = $('edit-link-id');
    const titleInput = $('link-title');
    const urlInput = $('link-url');
    const catInput = $('link-cat');
    const descInput = $('link-desc');
    if (editIdInput)
        editIdInput.value = String(id);
    if (titleInput)
        titleInput.value = link.title || '';
    if (urlInput)
        urlInput.value = link.url || '';
    if (catInput)
        catInput.value = link.category || 'other';
    if (descInput)
        descInput.innerHTML = sanitizeHTML(link.description) || '';
    const form = $('link-form-card');
    if (form)
        form.style.display = 'block';
    if (titleInput)
        titleInput.focus();
}
function cancelLinkEdit() {
    const editIdInput = $('edit-link-id');
    const titleInput = $('link-title');
    const urlInput = $('link-url');
    const catInput = $('link-cat');
    const descInput = $('link-desc');
    if (editIdInput)
        editIdInput.value = '';
    if (titleInput)
        titleInput.value = '';
    if (urlInput)
        urlInput.value = '';
    if (catInput)
        catInput.value = 'rules';
    if (descInput)
        descInput.innerHTML = '';
    const form = $('link-form-card');
    if (form)
        form.style.display = 'none';
}
function deleteLink(id) {
    const D = window.D;
    const link = EntityLookup.link(id);
    if (confirm(`Link "${link?.title || 'Unbekannt'}" löschen?`)) {
        pushUndo('Link gelöscht');
        const numId = typeof id === 'string' ? parseInt(id) : id;
        D.links = D.links.filter((l) => l.id !== numId);
        renderLinks();
        save();
    }
}
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.renderLinks = renderLinks;
window.toggleLinkForm = toggleLinkForm;
window.saveLink = saveLink;
window.editLink = editLink;
window.cancelLinkEdit = cancelLinkEdit;
window.deleteLink = deleteLink;
//# sourceMappingURL=links.js.map